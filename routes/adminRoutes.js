const express = require("express");
const router  = express.Router();
const { requireAdmin } = require("../middleware/auth");
const { postLogout } = require("../controllers/authController");
const {
    getAdminDashboard, getAdminBooks, addBook, editBook, deleteBook,
    getAdminUsers, getAdminIssued, markFinePaid,
    getAdminReturns, approveReturnRequest, declineReturnRequest,
} = require("../controllers/adminController");

router.use(requireAdmin);

router.get("/",                    getAdminDashboard);
router.get("/dashboard",           getAdminDashboard);
router.get("/books",               getAdminBooks);
router.post("/books/add",          addBook);
router.post("/books/edit/:id",     editBook);
router.post("/books/delete/:id",   deleteBook);
router.get("/users",               getAdminUsers);
router.get("/issued",              getAdminIssued);
router.get("/issued-books",        getAdminIssued);
router.get("/issued_books",        getAdminIssued);
router.get("/returns",             getAdminReturns);
router.get("/returned-books",      getAdminReturns);
router.get("/returned_books",      getAdminReturns);
router.post("/returns/approve/:id", approveReturnRequest);
router.post("/returns/decline/:id", declineReturnRequest);
router.post("/fine/mark-paid/:id", markFinePaid);
router.post("/logout",             postLogout);

module.exports = router;
