const nodemailer = require('nodemailer');

/**
 * Send an email via Brevo REST API (HTTPS port 443) or SMTP fallback.
 * Brevo REST API avoids Render's outbound SMTP port blocking.
 */
async function sendEmail({ to, subject, html }) {
  const senderEmail = process.env.SENDER_EMAIL || process.env.SMTP_USER || 'noreply@aidocassistant.com';
  const senderName = process.env.SENDER_NAME || 'AI Doc Assistant';

  // 1. Try Brevo REST API (HTTPS - bypasses blocked SMTP ports on Render)
  if (process.env.BREVO_API_KEY) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Brevo API HTTP ${response.status}`);
      }

      console.log(`  ✅ Email successfully sent to ${to} via Brevo API`);
      return true;
    } catch (err) {
      console.error(`  ❌ Failed to send email via Brevo API:`, err.message);
    }
  }

  // 2. Fallback to SMTP / Nodemailer (Brevo SMTP or Gmail SMTP)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
      const port = parseInt(process.env.SMTP_PORT || '587', 10);

      const transporter = nodemailer.createTransport(
        process.env.SMTP_HOST
          ? {
              host,
              port,
              secure: port === 465,
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            }
          : {
              service: 'gmail',
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            }
      );

      await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to,
        subject,
        html,
      });

      console.log(`  ✅ Email successfully sent to ${to} via SMTP`);
      return true;
    } catch (err) {
      console.error(`  ❌ Failed to send email via SMTP:`, err.message);
    }
  }

  console.log('  ⚠️  No email provider (BREVO_API_KEY or SMTP credentials) configured or delivery failed.');
  return false;
}

module.exports = { sendEmail };
