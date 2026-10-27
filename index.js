require("dotenv").config();
const express    = require("express");
const path       = require("path");
const cors       = require("cors");
const session    = require("express-session");
const MongoStore = require("connect-mongo");

const connectDB         = require("./config/db");
const { startCronJobs } = require("./config/cronJobs");
const authRoutes        = require("./routes/authRoutes");
const bookRoutes        = require("./routes/bookRoutes");
const pageRoutes        = require("./routes/pageRoutes");
const adminRoutes       = require("./routes/adminRoutes");

const app = express();
const isProd = process.env.NODE_ENV === "production";
const assetVersion = process.env.RENDER_GIT_COMMIT || process.env.ASSET_VERSION || String(Date.now());

// ── Trust Railway/Render/Nginx proxy ─────────────────────────────
app.set("trust proxy", 1);

// ── Security & performance middleware ────────────────────────────
// Install: npm install helmet compression
try {
    const helmet      = require("helmet");
    const compression = require("compression");
    app.use(helmet({
        contentSecurityPolicy: false,   // adjust if you add CSP later
        crossOriginEmbedderPolicy: false,
    }));
    app.use(compression());             // gzip — ~70% smaller responses on mobile
} catch {
    console.warn("⚠️  helmet/compression not installed — run: npm install helmet compression");
}

app.use(cors({
    origin: process.env.APP_URL || "http://localhost:8080",
    credentials: true,
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret:            process.env.SESSION_SECRET,
    resave:            false,
    saveUninitialized: false,
    store:             MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
        maxAge:   1000 * 60 * 60 * 24,   // 1 day
        secure:   isProd,                 // HTTPS only in production
        httpOnly: true,                   // JS cannot read cookie
        sameSite: "lax",
    },
}));

app.use((req, res, next) => {
    res.locals.assetVersion = assetVersion;
    next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public"), {
    maxAge: isProd ? "7d" : 0,          // cache static files 7 days in prod
    setHeaders: (res, filePath) => {
        // Avoid stale UI after deploys: always revalidate CSS/JS.
        if (/\.(css|js)$/i.test(filePath)) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");
        }
    },
}));

// ── Routes ────────────────────────────────────────────────────────
app.use("/",      pageRoutes);
app.use("/",      authRoutes);
app.use("/",      bookRoutes);
app.use("/admin", adminRoutes);

// ── 404 ───────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).render("verify_status", {
        success: false,
        message: "Page not found (404). The URL may have changed or the page doesn't exist.",
    });
});

// ── Global error handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error("❌ Unhandled error:", err);
    res.status(500).send("Something went wrong. Please try again.");
});

// ── Start ─────────────────────────────────────────────────────────
const BASE_PORT = Number(process.env.PORT) || 8080;
const MAX_PORT_ATTEMPTS = 10;

const startServer = (port, attemptsLeft) => {
    const server = app.listen(port, () => {
        const runningUrl = isProd
            ? (process.env.APP_URL || `http://localhost:${port}`)
            : `http://localhost:${port}`;
        console.log(`🚀 Server running → ${runningUrl}`);
    });

    server.on("error", (err) => {
        if (err.code === "EADDRINUSE" && attemptsLeft > 0) {
            const nextPort = port + 1;
            console.warn(`⚠️  Port ${port} is busy. Retrying on ${nextPort}...`);
            startServer(nextPort, attemptsLeft - 1);
            return;
        }

        console.error("❌ Failed to start server:", err);
        process.exit(1);
    });
};

connectDB().then(() => {
    startCronJobs();
    startServer(BASE_PORT, MAX_PORT_ATTEMPTS);
});