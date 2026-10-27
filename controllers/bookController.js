const Book       = require("../models/Book");
const IssuedBook = require("../models/IssuedBook");
const User       = require("../models/User");
const sendMail   = require("../config/mailer");
const templates  = require("../config/emailTemplates");

const formatDate = (dateVal) => {
    const d = new Date(dateVal);
    return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
};

const daysFromDate = (dueDate, referenceDate = new Date()) => {
    const now = new Date(referenceDate); now.setHours(0,0,0,0);
    const due = new Date(dueDate); due.setHours(0,0,0,0);
    return Math.floor((due - now) / (1000*60*60*24));
};

const getFineSnapshot = (record, referenceDate = new Date()) => {
    const daysLeft = daysFromDate(record.due_date, referenceDate);
    const overdue  = daysLeft < 0;
    const fine     = overdue ? Math.abs(daysLeft) * 10 : 0;
    return { daysLeft, overdue, fine };
};

// GET /browse
const getBrowse = (req, res) => {
    if (!req.session.user_id) return res.redirect("/login");
    res.render("browse", { username: req.session.username, user_id: req.session.user_id, error: req.query.error || null });
};

// GET /search
const searchBooks = async (req, res) => {
    if (!req.session.user_id) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const q     = req.query.q || "";
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip  = (page - 1) * limit;
    try {
        const filter = q ? {
            $or: [
                { title:     { $regex: q, $options: "i" } },
                { author:    { $regex: q, $options: "i" } },
                { publisher: { $regex: q, $options: "i" } },
            ],
        } : {};
        const books   = await Book.find(filter).skip(skip).limit(limit + 1).lean();
        const hasMore = books.length > limit;
        if (hasMore) books.pop();
        res.json({ success: true, books, hasMore });
    } catch (err) {
        res.json({ success: false, error: "Database error" });
    }
};

// GET /issued_books
const getIssuedBooks = async (req, res) => {
    if (!req.session.user_id) return res.redirect("/login");
    try {
        const issued = await IssuedBook.find({ user: req.session.user_id, returned: false }).lean();
        if (issued.length === 0) {
            return res.render("issued_books", {
                issuedBooks: [],
                username: req.session.username,
                user_id: req.session.user_id,
                message: req.query.message || null,
                type: req.query.type || "success",
            });
        }
        const bookIds = issued.map(i => i.book_id);
        const books   = await Book.find({ book_id: { $in: bookIds } }).lean();

        const issuedBooks = books.map(book => {
            const record   = issued.find(i => i.book_id === book.book_id);
            const snapshotDate =
                record.returnRequestStatus === "pending" && record.returnRequestedAt
                    ? record.returnRequestedAt
                    : new Date();
            const { daysLeft, overdue, fine } = getFineSnapshot(record, snapshotDate);

            return {
                ...book,
                issue_date: formatDate(record.issue_date),
                due_date: formatDate(record.due_date),
                daysLeft,
                overdue,
                fine,
                finePaid: record.finePaid,
                returnRequestStatus: record.returnRequestStatus,
                returnRequestedAt: record.returnRequestedAt ? formatDate(record.returnRequestedAt) : null,
            };
        });

        res.render("issued_books", {
            issuedBooks,
            username: req.session.username,
            user_id: req.session.user_id,
            message: req.query.message || null,
            type: req.query.type || "success",
        });
    } catch (err) {
        console.error("Issued books error:", err);
        res.status(500).send("Internal Server Error");
    }
};

// POST /borrow
const borrowBook = async (req, res) => {
    if (!req.session.user_id) return res.redirect("/login");
    const { book_id, book_name } = req.body;
    try {
        // Check already borrowed
        const alreadyIssued = await IssuedBook.findOne({ user: req.session.user_id, book_id: Number(book_id), returned: false });
        if (alreadyIssued) {
            return res.redirect("/browse?error=already_borrowed");
        }

        // Check stock
        const book = await Book.findOne({ book_id: Number(book_id) });
        if (!book || book.availableStock <= 0) {
            return res.redirect("/browse?error=out_of_stock");
        }

        const issue_date = new Date();
        const due_date   = new Date();
        due_date.setDate(due_date.getDate() + 40);

        const newRecord = await IssuedBook.create({
            user:      req.session.user_id,
            username:  req.session.username,
            book_id:   Number(book_id),
            book_name,
            issue_date,
            due_date,
        });

        // Decrease available stock
        await Book.findOneAndUpdate({ book_id: Number(book_id) }, { $inc: { availableStock: -1 } });

        // Send email
        const user = await User.findById(req.session.user_id).select("email");
        if (user?.email) {
            await sendMail({ to: user.email, ...templates.bookIssued(req.session.username, book_name, formatDate(issue_date), formatDate(due_date)) });
            newRecord.reminders.issued = true;
            await newRecord.save();
        }

        res.redirect("/issued_books");
    } catch (err) {
        console.error("Borrow error:", err);
        res.status(500).send("Failed to borrow book.");
    }
};

// POST /return
const returnBook = async (req, res) => {
    if (!req.session.user_id) return res.redirect("/login");
    const { book_id } = req.body;
    try {
        const record = await IssuedBook.findOne({ user: req.session.user_id, book_id: Number(book_id), returned: false });
        if (!record) {
            return res.redirect("/issued_books?type=error&message=No active issue record found for this book");
        }

        if (record.returnRequestStatus === "pending") {
            return res.redirect("/issued_books?type=error&message=Return request already pending admin confirmation");
        }

        record.returnRequestStatus = "pending";
        record.returnRequestedAt = new Date();
        record.returnDecisionAt = null;
        await record.save();

        res.redirect("/issued_books?type=success&message=Return request submitted. Waiting for admin confirmation");
    } catch (err) {
        console.error("Return error:", err);
        res.status(500).send("Failed to return book.");
    }
};

module.exports = { getBrowse, searchBooks, getIssuedBooks, borrowBook, returnBook };
