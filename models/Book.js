const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
    {
        book_id: { type: Number, required: true, unique: true },
        title:   { type: String, required: true, trim: true },
        author:  { type: String, trim: true },
        publisher: { type: String, trim: true },
        published_year: { type: Number },
        cover_image: { type: String, default: null },
        totalStock:     { type: Number, default: 1, min: 0 },
        availableStock: { type: Number, default: 1, min: 0 },
    },
    { timestamps: true }
);

bookSchema.index({ title: "text", author: "text", publisher: "text" });

module.exports = mongoose.model("Book", bookSchema);
