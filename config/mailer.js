const nodemailer = require("nodemailer");

const MAIL_TIMEOUT_MS = Number(process.env.MAIL_TIMEOUT_MS || 15000);
const MAIL_TRANSPORT = (process.env.MAIL_TRANSPORT || "smtp").toLowerCase();
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 0);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "").toLowerCase() === "true";
const MAIL_FROM = process.env.MAIL_FROM?.trim() || process.env.MAIL_USER;
const BREVO_API_KEY = process.env.BREVO_API_KEY;

if (MAIL_TRANSPORT === "smtp" && (!process.env.MAIL_USER || !process.env.MAIL_PASS)) {
    console.error("❌ MAIL_USER / MAIL_PASS missing. Email features will fail until configured.");
}

if (MAIL_TRANSPORT === "brevo-api" && !BREVO_API_KEY) {
    console.error("❌ BREVO_API_KEY missing. Brevo API mail mode will fail until configured.");
}

const transportConfig = {
    connectionTimeout: MAIL_TIMEOUT_MS,
    greetingTimeout: MAIL_TIMEOUT_MS,
    socketTimeout: MAIL_TIMEOUT_MS,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
};

if (SMTP_HOST) {
    transportConfig.host = SMTP_HOST;
    transportConfig.port = SMTP_PORT || 587;
    transportConfig.secure = SMTP_PORT ? SMTP_SECURE : false;
} else {
    // Backward-compatible fallback for existing Gmail config
    transportConfig.host = "smtp.gmail.com";
    transportConfig.port = 465;
    transportConfig.secure = true;
}

const transporter = nodemailer.createTransport(transportConfig);

if (MAIL_TRANSPORT === "smtp") {
    // Verify SMTP connection on startup
    transporter.verify((err) => {
        if (err) {
            console.error("❌ Mail transporter FAILED to connect:");
            console.error("   Host:", transportConfig.host);
            console.error("   Port:", transportConfig.port);
            console.error("   Reason:", err.message);
            console.error("   Code:", err.code);
        } else {
            console.log(`✅ Mail transporter connected — ${transportConfig.host}:${transportConfig.port}`);
        }
    });
} else if (MAIL_TRANSPORT === "brevo-api") {
    console.log("✅ Mail transport mode: Brevo API (HTTPS)");
}

const sendViaBrevoApi = async ({ to, subject, html }) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MAIL_TIMEOUT_MS);

    try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "content-type": "application/json",
                "api-key": BREVO_API_KEY,
            },
            body: JSON.stringify({
                sender: { name: "MyLibrary", email: MAIL_FROM },
                to: [{ email: to }],
                subject,
                htmlContent: html,
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Brevo API ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        return { messageId: data.messageId || data.messageIds?.[0], response: "Brevo API accepted" };
    } catch (err) {
        if (err.name === "AbortError") {
            throw new Error(`Mail send timed out after ${MAIL_TIMEOUT_MS}ms`);
        }
        throw err;
    } finally {
        clearTimeout(timeout);
    }
};

const sendMail = async ({ to, subject, html }) => {
    try {
        console.log(`📤 Attempting to send mail to: ${to}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   From: ${MAIL_FROM}`);
        console.log(`   Timeout: ${MAIL_TIMEOUT_MS}ms`);

        let info;

        if (MAIL_TRANSPORT === "brevo-api") {
            info = await sendViaBrevoApi({ to, subject, html });
        } else {
            info = await Promise.race([
                transporter.sendMail({
                    from: `"MyLibrary" <${MAIL_FROM}>`,
                    to,
                    subject,
                    html,
                }),
                new Promise((_, reject) => {
                    setTimeout(() => reject(new Error(`Mail send timed out after ${MAIL_TIMEOUT_MS}ms`)), MAIL_TIMEOUT_MS);
                }),
            ]);
        }

        console.log(`✅ Mail accepted by provider`);
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Response:   ${info.response}`);
        return info;
    } catch (err) {
        console.error(`❌ Mail FAILED`);
        console.error(`   To:      ${to}`);
        console.error(`   Error:   ${err.message}`);
        console.error(`   Code:    ${err.code}`);
        console.error(`   Full:    ${JSON.stringify(err, null, 2)}`);
        throw err;
    }
};

module.exports = sendMail;
