const cron      = require("node-cron");
const IssuedBook = require("../models/IssuedBook");
const User       = require("../models/User");
const sendMail   = require("./mailer");
const templates  = require("./emailTemplates");

const formatDate = (date) => {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
};

const runDailyChecks = async () => {
    console.log("⏰ Running daily fine & reminder checks...");
    const now = new Date(); now.setHours(0, 0, 0, 0);

    try {
        const allIssued = await IssuedBook.find({ returned: false, returnRequestStatus: { $ne: "pending" } });
        let processed = 0;

        for (const record of allIssued) {
            try {
                const user = await User.findById(record.user).select("email username");
                if (!user?.email) continue;

                const due         = new Date(record.due_date); due.setHours(0, 0, 0, 0);
                const msPerDay    = 1000 * 60 * 60 * 24;
                const daysOverdue = Math.floor((now - due) / msPerDay); // positive = overdue
                const daysLeft    = -daysOverdue;                        // positive = days remaining
                const dueDateStr  = formatDate(record.due_date);

                let changed = false;

                // ── Day 20 reminder ───────────────────────────────────────────────
                if (daysLeft === 20 && !record.reminders.day20) {
                    await sendMail({ to: user.email, ...templates.reminder20Days(user.username, record.book_name, dueDateStr, 20) });
                    record.reminders.day20 = true;
                    changed = true;
                }

                // ── Day 39 (last day) reminder ────────────────────────────────────
                if (daysLeft === 1 && !record.reminders.day39) {
                    await sendMail({ to: user.email, ...templates.reminderLastDay(user.username, record.book_name, dueDateStr) });
                    record.reminders.day39 = true;
                    changed = true;
                }

                // ── Due date reached (daysOverdue === 0 means today IS due date) ──
                if (daysOverdue === 0 && !record.reminders.deadline) {
                    await sendMail({ to: user.email, ...templates.deadlineReached(user.username, record.book_name, dueDateStr) });
                    record.reminders.deadline = true;
                    changed = true;
                }

                // ── Overdue: update fine + send daily email ────────────────────
                if (daysOverdue > 0) {
                    const totalFine  = daysOverdue * 10;
                    record.fine      = totalFine;
                    // Send daily overdue mail (once per day — no duplicate on day 1)
                    await sendMail({ to: user.email, ...templates.overdueDaily(user.username, record.book_name, daysOverdue, totalFine) });
                    if (!record.reminders.overdue) record.reminders.overdue = true;
                    changed = true;
                }

                if (changed) { await record.save(); processed++; }
            } catch (recordErr) {
                console.error(`❌ Failed processing record ${record._id}:`, recordErr.message);
            }
        }

        console.log(`✅ Daily check done. Processed ${processed}/${allIssued.length} record(s).`);
    } catch (err) {
        console.error("❌ Cron job error:", err.message);
    }
};

const startCronJobs = () => {
    // Every day at 8:00 AM IST
    cron.schedule("0 8 * * *", runDailyChecks, { timezone: "Asia/Kolkata" });
    console.log("✅ Cron jobs scheduled — daily at 8:00 AM IST");
};

module.exports = { startCronJobs, runDailyChecks };
