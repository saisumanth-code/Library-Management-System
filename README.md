## Setup

1. Clone the repo
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in your values
	- For Render, set `APP_URL` to your public HTTPS URL (example: `https://your-service.onrender.com`)
	- If Gmail SMTP times out on Render (`ETIMEDOUT`), configure an SMTP provider (Brevo/SendGrid/Mailgun) via `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`
	- If Brevo SMTP also times out on Render, switch to Brevo API mode: `MAIL_TRANSPORT=brevo-api` with `BREVO_API_KEY`
	- Set `MAIL_FROM` to a verified sender email from your SMTP provider (recommended)
4. Run `node init.js` to set up the database
5. Run `node scripts/fetchCovers` to set up the book covers
5. Run `node index.js` to start the server
