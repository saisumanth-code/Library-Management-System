const mongoose = require("mongoose");

const issuedBookSchema = new mongoose.Schema(
    {
        user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        username:  { type: String, required: true },
        book_id:   { type: Number, required: true },
        book_name: { type: String, required: true },
        issue_date: { type: Date, required: true, default: Date.now },
        due_date:   { type: Date, required: true },
        fine:       { type: Number, default: 0 },
        finePaid:   { type: Boolean, default: false },
        returned:   { type: Boolean, default: false },
        returnedAt: { type: Date, default: null },
        returnRequestStatus: {
            type: String,
            enum: ["none", "pending", "declined"],
            default: "none",
        },
        returnRequestedAt: { type: Date, default: null },
        returnDecisionAt:  { type: Date, default: null },
        reminders: {
            issued:   { type: Boolean, default: false },
            day20:    { type: Boolean, default: false },
            day39:    { type: Boolean, default: false },
            deadline: { type: Boolean, default: false },
            overdue:  { type: Boolean, default: false },
        },
    },
    { timestamps: true }
);

issuedBookSchema.index({ user: 1, book_id: 1 }, { unique: true });

module.exports = mongoose.model("IssuedBook", issuedBookSchema);
