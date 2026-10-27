const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const crypto   = require("crypto");

const userSchema = new mongoose.Schema(
    {
        username:   { type: String, required: true, unique: true, trim: true },
        email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
        password:   { type: String, required: true },
        isVerified: { type: Boolean, default: false },
        isAdmin:    { type: Boolean, default: false },

        // Email verification
        verifyToken:   { type: String,  default: null },
        verifyExpires: { type: Date,    default: null },

        // Password reset
        resetToken:    { type: String,  default: null },
        resetExpires:  { type: Date,    default: null },
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = async function (plain) {
    return bcrypt.compare(plain, this.password);
};

userSchema.methods.generateVerifyToken = function () {
    const token        = crypto.randomBytes(32).toString("hex");
    this.verifyToken   = token;
    this.verifyExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
    return token;
};

userSchema.methods.generateResetToken = function () {
    const token       = crypto.randomBytes(32).toString("hex");
    this.resetToken   = token;
    this.resetExpires = new Date(Date.now() + 1000 * 60 * 60); // 1h
    return token;
};

module.exports = mongoose.model("User", userSchema);
