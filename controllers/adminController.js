const User       = require("../models/User");
const Book       = require("../models/Book");
const IssuedBook = require("../models/IssuedBook");
const sendMail   = require("../config/mailer");
const templates  = require("../config/emailTemplates");

const formatDate = (dateVal) => {
    if (!dateVal) return "N/A";
    const d = new Date(dateVal);
    return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
};

const normalizeCoverImage = (value) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

const daysFromDate = (dueDate, referenceDate = new Date()) => {
    const now = new Date(referenceDate); now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate); due.setHours(0, 0, 0, 0);
    return Math.floor((due - now) / (1000 * 60 * 60 * 24));
};

const getFineSnapshot = (record, referenceDate = new Date()) => {
    const daysLeft = daysFromDate(record.due_date, referenceDate);
    const overdue  = daysLeft < 0;
    const fine     = overdue ? Math.abs(daysLeft) * 10 : 0;
    return { daysLeft, overdue, fine };
};

// GET /admin
const getAdminDashboard = async (req, res) => {
    try {
        const totalUsers   = await User.countDocuments({ isAdmin: false });
        const totalBooks   = await Book.countDocuments();
        const totalIssued  = await IssuedBook.countDocuments({ returned: false });
        const overdueBooks = await IssuedBook.countDocuments({
            returned: false,
            returnRequestStatus: { $ne: "pending" },
            due_date: { $lt: new Date() },
        });
        const pendingReturns = await IssuedBook.countDocuments({ returned: false, returnRequestStatus: "pending" });
        res.render("admin/dashboard", { totalUsers, totalBooks, totalIssued, overdueBooks, pendingReturns });
    } catch (err) {
        console.error("Admin dashboard error:", err);
        res.status(500).send("Server Error");
    }
};

// GET /admin/books
const getAdminBooks = async (req, res) => {
    try {
        const q     = req.query.q || "";
        const page  = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip  = (page - 1) * limit;
        const filter = q ? { $or: [{ title: { $regex: q, $options: "i" } }, { author: { $regex: q, $options: "i" } }] } : {};
        const books     = await Book.find(filter).skip(skip).limit(limit).lean();
        const total     = await Book.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);
        res.render("admin/books", { books, q, page, totalPages, message: req.query.message || null });
    } catch (err) {
        res.status(500).send("Server Error");
    }
};

// POST /admin/books/add
const addBook = async (req, res) => {
    const { title, author, publisher, published_year, totalStock, cover_image } = req.body;
    try {
        const lastBook = await Book.findOne().sort({ book_id: -1 });
        const newId    = lastBook ? lastBook.book_id + 1 : 1;
        const stock    = parseInt(totalStock) || 1;
        const coverImage = normalizeCoverImage(cover_image);
        await Book.create({
            book_id: newId,
            title,
            author,
            publisher,
            published_year: parseInt(published_year) || null,
            cover_image: coverImage,
            totalStock: stock,
            availableStock: stock,
        });
        res.redirect("/admin/books?message=Book added successfully");
    } catch (err) {
        console.error("Add book error:", err);
        res.redirect("/admin/books?message=Failed to add book");
    }
};

// POST /admin/books/edit/:id
const editBook = async (req, res) => {
    const { title, author, publisher, published_year, totalStock, cover_image } = req.body;
    try {
        const book    = await Book.findById(req.params.id);
        const oldStock = book.totalStock;
        const newStock = parseInt(totalStock) || 1;
        const diff     = newStock - oldStock;
        const coverImage = normalizeCoverImage(cover_image);

        const update = {
            title,
            author,
            publisher,
            published_year: parseInt(published_year) || null,
            totalStock: newStock,
            availableStock: Math.max(0, book.availableStock + diff),
        };

        // Keep current cover when left blank; update only when URL is provided.
        if (coverImage !== null) update.cover_image = coverImage;

        await Book.findByIdAndUpdate(req.params.id, {
            ...update,
        });
        res.redirect("/admin/books?message=Book updated successfully");
    } catch (err) {
        res.redirect("/admin/books?message=Failed to update book");
    }
};

// POST /admin/books/delete/:id
const deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.redirect("/admin/books?message=Book not found");
        // Don't delete if currently issued
        const isIssued = await IssuedBook.findOne({ book_id: book.book_id, returned: false });
        if (isIssued) return res.redirect("/admin/books?message=Cannot delete — book is currently borrowed");
        await Book.findByIdAndDelete(req.params.id);
        res.redirect("/admin/books?message=Book deleted successfully");
    } catch (err) {
        res.redirect("/admin/books?message=Failed to delete book");
    }
};

// GET /admin/users
const getAdminUsers = async (req, res) => {
    try {
        const q      = req.query.q || "";
        const filter = q ? { isAdmin: false, $or: [{ username: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }] } : { isAdmin: false };
        const users  = await User.find(filter).select("-password").lean();
        res.render("admin/users", { users, q, message: req.query.message || null });
    } catch (err) {
        res.status(500).send("Server Error");
    }
};

// GET /admin/issued
const getAdminIssued = async (req, res) => {
    try {
        const records = await IssuedBook.find({ returned: false }).lean();
        const issuedBooks = records.map(r => {
            const snapshotDate =
                r.returnRequestStatus === "pending" && r.returnRequestedAt
                    ? r.returnRequestedAt
                    : new Date();
            const { daysLeft, overdue, fine } = getFineSnapshot(r, snapshotDate);

            return {
                ...r,
                issue_date: formatDate(r.issue_date),
                due_date: formatDate(r.due_date),
                daysLeft,
                overdue,
                fine,
                returnRequestedAtFormatted: r.returnRequestedAt ? formatDate(r.returnRequestedAt) : null,
            };
        });

        res.render("admin/issued", { issuedBooks, message: req.query.message || null });
    } catch (err) {
        res.status(500).send("Server Error");
    }
};

// POST /admin/fine/mark-paid/:id
const markFinePaid = async (req, res) => {
    try {
        await IssuedBook.findByIdAndUpdate(req.params.id, { finePaid: true });
        res.redirect("/admin/issued?message=Fine marked as paid");
    } catch (err) {
        res.redirect("/admin/issued?message=Failed to update fine");
    }
};

// GET /admin/returns
const getAdminReturns = async (req, res) => {
    try {
        const records = await IssuedBook.find({ returned: false, returnRequestStatus: { $in: ["pending", "declined"] } })
            .sort({ returnRequestedAt: -1, updatedAt: -1 })
            .lean();

        const returnRequests = records.map((r) => {
            const snapshotDate =
                r.returnRequestStatus === "pending" && r.returnRequestedAt
                    ? r.returnRequestedAt
                    : new Date();
            const { fine } = getFineSnapshot(r, snapshotDate);

            return {
                ...r,
                issueDateFormatted: formatDate(r.issue_date),
                dueDateFormatted: formatDate(r.due_date),
                requestDateFormatted: r.returnRequestedAt ? formatDate(r.returnRequestedAt) : "N/A",
                fine,
            };
        });

        res.render("admin/returns", { returnRequests, message: req.query.message || null });
    } catch (err) {
        console.error("Admin returns page error:", err);
        res.status(500).send("Server Error");
    }
};

// POST /admin/returns/approve/:id
const approveReturnRequest = async (req, res) => {
    try {
        const record = await IssuedBook.findOne({
            _id: req.params.id,
            returned: false,
            returnRequestStatus: "pending",
        });

        if (!record) {
            return res.redirect("/admin/returns?message=Return request not found or already processed");
        }

        const effectiveReturnDate = record.returnRequestedAt || new Date();
        const { fine } = getFineSnapshot(record, effectiveReturnDate);
        const returnDateFormatted = formatDate(effectiveReturnDate);

        await Book.findOneAndUpdate({ book_id: record.book_id }, { $inc: { availableStock: 1 } });

        const user = await User.findById(record.user).select("email username");
        if (user?.email) {
            await sendMail({
                to: user.email,
                ...templates.bookReturned(user.username || record.username, record.book_name, returnDateFormatted, fine),
            });
        }

        await IssuedBook.findByIdAndDelete(record._id);
        res.redirect("/admin/returns?message=Return request approved and book returned successfully");
    } catch (err) {
        console.error("Approve return request error:", err);
        res.redirect("/admin/returns?message=Failed to approve return request");
    }
};

// POST /admin/returns/decline/:id
const declineReturnRequest = async (req, res) => {
    try {
        const record = await IssuedBook.findOne({
            _id: req.params.id,
            returned: false,
            returnRequestStatus: "pending",
        });

        if (!record) {
            return res.redirect("/admin/returns?message=Return request not found or already processed");
        }

        record.returnRequestStatus = "declined";
        record.returnDecisionAt = new Date();
        await record.save();

        const user = await User.findById(record.user).select("email username");
        if (user?.email) {
            await sendMail({
                to: user.email,
                ...templates.returnDeclined(user.username || record.username, record.book_name),
            });
        }

        res.redirect("/admin/returns?message=Return request declined and user notified");
    } catch (err) {
        console.error("Decline return request error:", err);
        res.redirect("/admin/returns?message=Failed to decline return request");
    }
};

module.exports = {
    getAdminDashboard,
    getAdminBooks,
    addBook,
    editBook,
    deleteBook,
    getAdminUsers,
    getAdminIssued,
    markFinePaid,
    getAdminReturns,
    approveReturnRequest,
    declineReturnRequest,
};
