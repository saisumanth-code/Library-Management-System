const express = require("express");
const router = express.Router();
const {
    getBrowse,
    searchBooks,
    getIssuedBooks,
    borrowBook,
    returnBook,
} = require("../controllers/bookController");

router.get("/browse", getBrowse);
router.get("/search", searchBooks);
router.get("/issued_books", getIssuedBooks);
router.post("/borrow", borrowBook);
router.post("/return", returnBook);

module.exports = router;
