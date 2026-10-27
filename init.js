/**
 * init.js — Run once to set up MongoDB
 * Usage: node init.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User      = require("./models/User");
const Book      = require("./models/Book");
const IssuedBook = require("./models/IssuedBook");

const run = async () => {
    await connectDB();
    console.log("\n📦 Starting database initialization...\n");

    await User.deleteMany({});
    await Book.deleteMany({});
    await IssuedBook.deleteMany({});
    console.log("🗑️  Cleared existing data");

    await User.createIndexes();
    await Book.createIndexes();
    await IssuedBook.createIndexes();
    console.log("📇  Indexes created");

    // Create admin user
    await User.create({ username: "admin", email: "admin@library.com", password: "admin123", isVerified: true, isAdmin: true });
    console.log("👑  Admin user created  →  admin / admin123");
    console.log("    ⚠️  Change admin password after first login!");

    // Seed sample books (uncomment below to import full dataset)
    const raw = require("./data/books.json");
    await Book.insertMany(raw.map(b => ({ ...b, totalStock: 3, availableStock: 3 })));

    // const sampleBooks = [
    //     { book_id: 1,  title: "The Great Gatsby",          author: "F. Scott Fitzgerald", publisher: "Scribner",          published_year: 1925 },
    //     { book_id: 2,  title: "To Kill a Mockingbird",     author: "Harper Lee",           publisher: "J. B. Lippincott", published_year: 1960 },
    //     { book_id: 3,  title: "1984",                      author: "George Orwell",        publisher: "Secker & Warburg", published_year: 1949 },
    //     { book_id: 4,  title: "Harry Potter and the Philosopher's Stone", author: "J.K. Rowling", publisher: "Bloomsbury", published_year: 1997 },
    //     { book_id: 5,  title: "The Alchemist",             author: "Paulo Coelho",         publisher: "HarperCollins",    published_year: 1988 },
    // ].map(b => ({ ...b, totalStock: 3, availableStock: 3 }));

    // await Book.insertMany(sampleBooks);
    // console.log(`📚  Seeded ${sampleBooks.length} sample books (stock: 3 each)`);
    // console.log("\n✅  Done! Run `node index.js` to start.\n");

    await mongoose.disconnect();
    process.exit(0);
};

run().catch(err => { console.error("❌ Init failed:", err); process.exit(1); });
