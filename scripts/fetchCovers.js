/**
 * scripts/fetchCovers.js
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time script: fetches cover images for all books from Open Library API
 * and saves the URLs back to MongoDB.
 *
 * Usage:  node scripts/fetchCovers.js
 *
 * Open Library API (free, no key needed):
 *   Search:  https://openlibrary.org/search.json?title=...&author=...&limit=1
 *   Cover:   https://covers.openlibrary.org/b/id/{cover_i}-M.jpg
 * ─────────────────────────────────────────────────────────────────────────────
 */
require("dotenv").config();
const https      = require("https");
const connectDB  = require("../config/db");
const Book       = require("../models/Book");

// ── tiny HTTPS GET helper ─────────────────────────────────────────────────────
const get = (url) => new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "MyLibrary-CoverFetcher/1.0" } }, (res) => {
        let data = "";
        res.on("data", chunk => data += chunk);
        res.on("end", () => {
            try { resolve(JSON.parse(data)); }
            catch { resolve(null); }
        });
    }).on("error", reject);
});

// ── sleep helper to respect rate limits ──────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── fetch one cover URL for a book ───────────────────────────────────────────
const fetchCoverUrl = async (title, author) => {
    try {
        const q   = encodeURIComponent(title);
        const a   = encodeURIComponent(author || "");
        const url = `https://openlibrary.org/search.json?title=${q}&author=${a}&limit=1&fields=cover_i,title`;
        const data = await get(url);

        if (!data?.docs?.length) return null;

        const coverId = data.docs[0]?.cover_i;
        if (!coverId) return null;

        // -M = medium size (180×280 approx), -L for large
        return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
    } catch {
        return null;
    }
};

// ── main ─────────────────────────────────────────────────────────────────────
const run = async () => {
    await connectDB();

    // Only process books that don't already have a cover
    const books = await Book.find({ cover_image: null }).lean();
    console.log(`\n📚 Found ${books.length} book(s) without cover images\n`);

    if (books.length === 0) {
        console.log("✅ All books already have covers. Nothing to do.");
        process.exit(0);
    }

    let updated = 0;
    let failed  = 0;

    for (let i = 0; i < books.length; i++) {
        const book = books[i];
        process.stdout.write(`[${i + 1}/${books.length}] "${book.title}" ... `);

        const coverUrl = await fetchCoverUrl(book.title, book.author);

        if (coverUrl) {
            await Book.findByIdAndUpdate(book._id, { cover_image: coverUrl });
            console.log(`✅ ${coverUrl}`);
            updated++;
        } else {
            console.log("❌ Not found");
            failed++;
        }

        // Polite delay: 300ms between requests to avoid hammering the API
        await sleep(300);
    }

    console.log(`\n─────────────────────────────────────`);
    console.log(`✅ Updated : ${updated}`);
    console.log(`❌ Not found: ${failed}`);
    console.log(`─────────────────────────────────────\n`);
    console.log("Done! Restart your server to see the covers.\n");
    process.exit(0);
};

run().catch(err => {
    console.error("❌ Script failed:", err);
    process.exit(1);
});
