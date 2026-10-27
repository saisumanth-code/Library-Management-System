const User      = require("../models/User");
const sendMail  = require("../config/mailer");
const templates = require("../config/emailTemplates");

const getAppUrl = (req) => {
    const configuredAppUrl = process.env.APP_URL?.trim();
    if (configuredAppUrl) {
        const normalized = /^https?:\/\//i.test(configuredAppUrl)
            ? configuredAppUrl
            : `https://${configuredAppUrl}`;
        return normalized.replace(/\/+$/, "");
    }

    const forwardedProto = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const protocol = forwardedProto || req.protocol;
    const host = req.get("x-forwarded-host") || req.get("host");

    if (host) return `${protocol}://${host}`;
    return "http://localhost:8080";
};

// GET /signup
const getSignup = (req, res) => {
    if (req.session.user_id) {
        return req.session.isAdmin ? res.redirect("/admin") : res.redirect("/dashboard");
    }
    res.render("signup", { message: null, type: null });
};

// POST /signup
const postSignup = async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    if (!username || !email || !password || !confirmPassword)
        return res.render("signup", { message: "All fields are required.", type: "error" });
    if (password !== confirmPassword)
        return res.render("signup", { message: "Passwords do not match.", type: "error" });
    try {
        if (await User.findOne({ username }))
            return res.render("signup", { message: "Username already exists.", type: "error" });
        if (await User.findOne({ email }))
            return res.render("signup", { message: "Email already registered.", type: "error" });

        const newUser = new User({ username, email, password });
        const token   = newUser.generateVerifyToken();
        await newUser.save();

        const appUrl = getAppUrl(req);
        const verifyLink = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;
        try {
            await sendMail({ to: email, ...templates.verifyEmail(username, verifyLink) });
        } catch (mailErr) {
            console.error("Signup mail error:", mailErr.message);
            return res.render("signup", {
                message: "Account created, but verification email could not be sent right now. Please go to login and use resend verification.",
                type: "error",
            });
        }

        res.render("signup", {
            message: `A verification link has been sent to ${email}. Please check your inbox.`,
            type: "success",
        });
    } catch (err) {
        console.error("Signup error:", err);
        res.render("signup", { message: "Signup failed. Please try again.", type: "error" });
    }
};

// GET /verify-email?token=xxx
const verifyEmail = async (req, res) => {
    const { token } = req.query;
    if (!token) return res.render("verify_status", { success: false, message: "Invalid link." });
    try {
        const user = await User.findOne({ verifyToken: token, verifyExpires: { $gt: new Date() } });
        if (!user) return res.render("verify_status", { success: false, message: "Link is invalid or expired. Please sign up again." });

        user.isVerified    = true;
        user.verifyToken   = null;
        user.verifyExpires = null;
        await user.save();

        const appUrl = getAppUrl(req);
        await sendMail({ to: user.email, ...templates.verifySuccess(user.username, appUrl) });
        res.render("verify_status", { success: true, message: "Email verified! You can now log in." });
    } catch (err) {
        console.error("Verify error:", err);
        res.render("verify_status", { success: false, message: "Something went wrong." });
    }
};

// GET /login
const getLogin = (req, res) => {
    if (req.session.user_id) {
        return req.session.isAdmin ? res.redirect("/admin") : res.redirect("/dashboard");
    }
    res.render("login", { message: null });
};

// POST /login  (users only — admins use /admin-login)
const postLogin = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.render("login", { message: "All fields are required." });
    try {
        const user = await User.findOne({ username });
        if (!user) return res.render("login", { message: "Invalid credentials." });

        // Block admins from user login portal
        if (user.isAdmin)
            return res.render("login", { message: "Admin accounts must use the Admin Login portal.", type: "error" });

        if (!user.isVerified)
            return res.render("login", { message: "Please verify your email before logging in. Check your inbox." });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.render("login", { message: "Invalid credentials." });

        req.session.user_id  = user._id.toString();
        req.session.username = user.username;
        req.session.isAdmin  = false;

        res.redirect("/dashboard");
    } catch (err) {
        console.error("Login error:", err);
        res.render("login", { message: "Login failed. Please try again." });
    }
};

// POST /logout
const postLogout = (req, res) => {
    req.session.destroy(() => res.redirect("/"));
};

// GET /profile (JSON)
const getProfile = async (req, res) => {
    if (!req.session.user_id) return res.status(401).json({ error: "Not logged in" });
    try {
        const user = await User.findById(req.session.user_id).select("-password");
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({
            user_id: user._id,
            userId: user._id,
            username: user.username,
            email: user.email,
        });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

// GET /forgot-password
const getForgotPassword = (req, res) => {
    if (req.session.user_id) {
        return req.session.isAdmin ? res.redirect("/admin") : res.redirect("/dashboard");
    }
    res.render("forgot_password", { message: null, type: null });
};

// POST /forgot-password
const postForgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.render("forgot_password", { message: "Email is required.", type: "error" });
    try {
        const user = await User.findOne({ email });
        if (!user) return res.render("forgot_password", {
            message: "If that email exists, a reset link has been sent.",
            type: "success",
        });

        const token = user.generateResetToken();
        await user.save();

        const appUrl = getAppUrl(req);
        const resetLink = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
        await sendMail({ to: user.email, ...templates.forgotPassword(user.username, resetLink) });

        res.render("forgot_password", {
            message: "A password reset link has been sent to your email.",
            type: "success",
        });
    } catch (err) {
        console.error("Forgot password error:", err);
        res.render("forgot_password", { message: "Something went wrong.", type: "error" });
    }
};

// GET /reset-password?token=xxx
const getResetPassword = async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.render("verify_status", { success: false, message: "Reset link is invalid or incomplete." });
    }
    try {
        const user = await User.findOne({ resetToken: token, resetExpires: { $gt: new Date() } });
        if (!user) return res.render("verify_status", { success: false, message: "Reset link is invalid or expired." });
        res.render("reset_password", { token, message: null, type: null });
    } catch (err) {
        res.render("verify_status", { success: false, message: "Something went wrong." });
    }
};

// POST /reset-password
const postResetPassword = async (req, res) => {
    const token = req.body.token || req.params.token || req.query.token;
    const { password, confirmPassword } = req.body;
    if (!token)
        return res.render("verify_status", { success: false, message: "Reset link is invalid or incomplete." });
    if (!password || !confirmPassword)
        return res.render("reset_password", { token, message: "All fields are required.", type: "error" });
    if (password !== confirmPassword)
        return res.render("reset_password", { token, message: "Passwords do not match.", type: "error" });
    try {
        const user = await User.findOne({ resetToken: token, resetExpires: { $gt: new Date() } });
        if (!user) return res.render("verify_status", { success: false, message: "Reset link is invalid or expired." });

        user.password     = password;
        user.resetToken   = null;
        user.resetExpires = null;
        await user.save();

        await sendMail({ to: user.email, ...templates.passwordChanged(user.username) });
        res.render("verify_status", { success: true, message: "Password changed successfully! You can now log in." });
    } catch (err) {
        console.error("Reset password error:", err);
        res.render("reset_password", { token, message: "Something went wrong.", type: "error" });
    }
};

// POST /resend-verification
const resendVerification = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.render("login", { message: "Please enter your email to resend verification." });
    try {
        const user = await User.findOne({ email, isVerified: false });
        if (!user) return res.render("login", { message: "Email not found or already verified." });

        const token = user.generateVerifyToken();
        await user.save();

        const appUrl = getAppUrl(req);
        const verifyLink = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;
        await sendMail({ to: user.email, ...templates.verifyEmail(user.username, verifyLink) });

        res.render("login", { message: `Verification email resent to ${email}. Check your inbox.` });
    } catch (err) {
        console.error("Resend verify error:", err);
        res.render("login", { message: "Failed to resend. Try again." });
    }
};

// ── Admin Login ───────────────────────────────────────────────────────────────

// GET /admin-login
const getAdminLogin = (req, res) => {
    if (req.session.user_id && req.session.isAdmin) return res.redirect("/admin");
    res.render("admin_login", { message: null });
};

// POST /admin-login
const postAdminLogin = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.render("admin_login", { message: "All fields are required." });
    try {
        const user = await User.findOne({ username });

        if (!user || !user.isAdmin)
            return res.render("admin_login", { message: "Invalid admin credentials." });

        if (!user.isVerified)
            return res.render("admin_login", { message: "Account not verified." });

        const isMatch = await user.comparePassword(password);
        if (!isMatch)
            return res.render("admin_login", { message: "Invalid admin credentials." });

        req.session.user_id  = user._id.toString();
        req.session.username = user.username;
        req.session.isAdmin  = true;

        res.redirect("/admin");
    } catch (err) {
        console.error("Admin login error:", err);
        res.render("admin_login", { message: "Login failed. Please try again." });
    }
};

module.exports = {
    getSignup, postSignup,
    verifyEmail,
    getLogin, postLogin,
    postLogout, getProfile,
    getForgotPassword, postForgotPassword,
    getResetPassword, postResetPassword,
    resendVerification,
    getAdminLogin, postAdminLogin,
};
