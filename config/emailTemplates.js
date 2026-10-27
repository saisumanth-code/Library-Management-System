const bookIssued = (username, bookName, issueDate, dueDate) => ({
    subject: `📚 Book Issued: ${bookName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;">
        <div style="background:#183153;padding:20px;text-align:center;"><h1 style="color:white;margin:0;">MyLibrary</h1></div>
        <div style="padding:30px;">
            <h2 style="color:#183153;">Book Issued Successfully! 📖</h2>
            <p>Hello <strong>${username}</strong>, you have successfully borrowed:</p>
            <div style="background:#f2f7ff;padding:15px;border-radius:8px;margin:15px 0;">
                <p><strong>📚 Book:</strong> ${bookName}</p>
                <p><strong>📅 Issue Date:</strong> ${issueDate}</p>
                <p><strong>⏰ Due Date:</strong> ${dueDate}</p>
                <p><strong>💰 Fine if late:</strong> ₹10 per day after due date</p>
            </div>
            <p>Please return the book before the due date to avoid fines.</p>
            <p style="color:#888;font-size:13px;margin-top:30px;">— MyLibrary Team</p>
        </div></div>`
});

const reminder20Days = (username, bookName, dueDate, daysLeft) => ({
    subject: `⏰ Reminder: ${daysLeft} days left to return "${bookName}"`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;">
        <div style="background:#1b75d0;padding:20px;text-align:center;"><h1 style="color:white;margin:0;">MyLibrary</h1></div>
        <div style="padding:30px;">
            <h2 style="color:#1b75d0;">Return Reminder 🔔</h2>
            <p>Hello <strong>${username}</strong>, you have <strong>${daysLeft} days</strong> left to return:</p>
            <div style="background:#f2f7ff;padding:15px;border-radius:8px;margin:15px 0;">
                <p><strong>📚 Book:</strong> ${bookName}</p>
                <p><strong>⏰ Due Date:</strong> ${dueDate}</p>
            </div>
            <p style="color:#888;font-size:13px;margin-top:30px;">— MyLibrary Team</p>
        </div></div>`
});

const reminderLastDay = (username, bookName, dueDate) => ({
    subject: `🚨 Last Day! Return "${bookName}" today to avoid fine`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;">
        <div style="background:#e67e22;padding:20px;text-align:center;"><h1 style="color:white;margin:0;">MyLibrary</h1></div>
        <div style="padding:30px;">
            <h2 style="color:#e67e22;">⚠️ Last Day to Return!</h2>
            <p>Hello <strong>${username}</strong>, today is the last day to return without a fine:</p>
            <div style="background:#fff3e0;padding:15px;border-radius:8px;margin:15px 0;border-left:4px solid #e67e22;">
                <p><strong>📚 Book:</strong> ${bookName}</p>
                <p><strong>⏰ Due Date:</strong> ${dueDate}</p>
            </div>
            <p style="color:#888;font-size:13px;margin-top:30px;">— MyLibrary Team</p>
        </div></div>`
});

const deadlineReached = (username, bookName, dueDate) => ({
    subject: `❌ Deadline passed for "${bookName}" — Fine starts now`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;">
        <div style="background:#c0392b;padding:20px;text-align:center;"><h1 style="color:white;margin:0;">MyLibrary</h1></div>
        <div style="padding:30px;">
            <h2 style="color:#c0392b;">Return Deadline Passed ❌</h2>
            <p>Hello <strong>${username}</strong>, your return deadline has passed for:</p>
            <div style="background:#fdecea;padding:15px;border-radius:8px;margin:15px 0;border-left:4px solid #c0392b;">
                <p><strong>📚 Book:</strong> ${bookName}</p>
                <p><strong>⏰ Due Date was:</strong> ${dueDate}</p>
                <p><strong>💸 Fine started:</strong> ₹10/day</p>
            </div>
            <p style="color:#888;font-size:13px;margin-top:30px;">— MyLibrary Team</p>
        </div></div>`
});

const overdueDaily = (username, bookName, daysOverdue, totalFine) => ({
    subject: `💸 Fine Update: ₹${totalFine} due for "${bookName}"`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;">
        <div style="background:#c0392b;padding:20px;text-align:center;"><h1 style="color:white;margin:0;">MyLibrary</h1></div>
        <div style="padding:30px;">
            <h2 style="color:#c0392b;">Overdue Fine Update 💸</h2>
            <p>Hello <strong>${username}</strong>, your book is <strong>${daysOverdue} day(s) overdue</strong>.</p>
            <div style="background:#fdecea;padding:15px;border-radius:8px;margin:15px 0;border-left:4px solid #c0392b;">
                <p><strong>📚 Book:</strong> ${bookName}</p>
                <p><strong>📆 Days Overdue:</strong> ${daysOverdue}</p>
                <p><strong>💰 Total Fine:</strong> ₹${totalFine}</p>
            </div>
            <p style="color:#888;font-size:13px;margin-top:30px;">— MyLibrary Team</p>
        </div></div>`
});

const bookReturned = (username, bookName, returnDate, fine) => ({
    subject: `✅ Thank you for returning "${bookName}"`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;">
        <div style="background:#27ae60;padding:20px;text-align:center;"><h1 style="color:white;margin:0;">MyLibrary</h1></div>
        <div style="padding:30px;">
            <h2 style="color:#27ae60;">Book Returned Successfully ✅</h2>
            <p>Hello <strong>${username}</strong>, thank you for returning:</p>
            <div style="background:#eafaf1;padding:15px;border-radius:8px;margin:15px 0;border-left:4px solid #27ae60;">
                <p><strong>📚 Book:</strong> ${bookName}</p>
                <p><strong>📅 Returned On:</strong> ${returnDate}</p>
                ${fine > 0
                    ? `<p><strong>💰 Fine Charged:</strong> ₹${fine} (please clear at the library counter)</p>`
                    : `<p><strong>✅ Fine:</strong> None — returned on time!</p>`}
            </div>
            <p style="color:#888;font-size:13px;margin-top:30px;">— MyLibrary Team</p>
        </div></div>`
});

const returnDeclined = (username, bookName) => ({
    subject: `❌ Return request declined for "${bookName}"`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;">
        <div style="background:#c0392b;padding:20px;text-align:center;"><h1 style="color:white;margin:0;">MyLibrary</h1></div>
        <div style="padding:30px;">
            <h2 style="color:#c0392b;">Return Not Confirmed ❌</h2>
            <p>Hello <strong>${username}</strong>, your return request for the following book was declined by admin:</p>
            <div style="background:#fdecea;padding:15px;border-radius:8px;margin:15px 0;border-left:4px solid #c0392b;">
                <p><strong>📚 Book:</strong> ${bookName}</p>
                <p><strong>Status:</strong> Not returned (admin did not confirm physical handover)</p>
            </div>
            <p>Please hand over the book at the library counter and submit a new return request from your account.</p>
            <p style="color:#888;font-size:13px;margin-top:30px;">— MyLibrary Team</p>
        </div></div>`
});

const verifyEmail = (username, verifyLink) => ({
    subject: `✅ Verify your MyLibrary account`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;">
        <div style="background:#183153;padding:20px;text-align:center;"><h1 style="color:white;margin:0;">MyLibrary</h1></div>
        <div style="padding:30px;">
            <h2 style="color:#183153;">Welcome, ${username}! 👋</h2>
            <p>Please verify your email address to activate your account.</p>
            <div style="text-align:center;margin:30px 0;">
                <a href="${verifyLink}" style="background:#1b75d0;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;">Verify My Email</a>
            </div>
            <p style="color:#888;font-size:13px;">This link expires in <strong>24 hours</strong>.</p>
            <p style="color:#888;font-size:13px;margin-top:30px;">— MyLibrary Team</p>
        </div></div>`
});

const verifySuccess = (username, appUrl) => ({
    subject: `🎉 Account verified — Welcome to MyLibrary!`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;">
        <div style="background:#27ae60;padding:20px;text-align:center;"><h1 style="color:white;margin:0;">MyLibrary</h1></div>
        <div style="padding:30px;">
            <h2 style="color:#27ae60;">Email Verified Successfully! 🎉</h2>
            <p>Hello <strong>${username}</strong>, your account is now active!</p>
            <div style="text-align:center;margin:30px 0;">
                <a href="${appUrl}/login" style="background:#183153;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;">Go to Login</a>
            </div>
            <p style="color:#888;font-size:13px;margin-top:30px;">— MyLibrary Team</p>
        </div></div>`
});

const forgotPassword = (username, resetLink) => ({
    subject: `🔑 Reset your MyLibrary password`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;">
        <div style="background:#183153;padding:20px;text-align:center;"><h1 style="color:white;margin:0;">MyLibrary</h1></div>
        <div style="padding:30px;">
            <h2 style="color:#183153;">Password Reset Request 🔑</h2>
            <p>Hello <strong>${username}</strong>, we received a request to reset your password.</p>
            <div style="text-align:center;margin:30px 0;">
                <a href="${resetLink}" style="background:#c0392b;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;">Reset My Password</a>
            </div>
            <p style="color:#888;font-size:13px;">This link expires in <strong>1 hour</strong>.</p>
            <p style="color:#888;font-size:13px;">If you did not request this, ignore this email.</p>
            <p style="color:#888;font-size:13px;margin-top:30px;">— MyLibrary Team</p>
        </div></div>`
});

const passwordChanged = (username) => ({
    subject: `✅ Your MyLibrary password was changed`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;">
        <div style="background:#27ae60;padding:20px;text-align:center;"><h1 style="color:white;margin:0;">MyLibrary</h1></div>
        <div style="padding:30px;">
            <h2 style="color:#27ae60;">Password Changed Successfully ✅</h2>
            <p>Hello <strong>${username}</strong>, your password has been updated.</p>
            <p>If you did not make this change, contact us immediately.</p>
            <p style="color:#888;font-size:13px;margin-top:30px;">— MyLibrary Team</p>
        </div></div>`
});

module.exports = {
    bookIssued, reminder20Days, reminderLastDay,
    deadlineReached, overdueDaily, bookReturned,
    returnDeclined,
    verifyEmail, verifySuccess,
    forgotPassword, passwordChanged,
};
