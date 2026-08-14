const nodemailer = require('nodemailer');

/**
 * Send an email via Brevo REST API (HTTPS port 443) or SMTP fallback.
 * Brevo REST API avoids Render's outbound SMTP port blocking.
 */
async function sendEmail({ to, subject, html }) {
  const senderEmail = process.env.SENDER_EMAIL || process.env.SMTP_USER || 'noreply@aidocassistant.com';
  const senderName = process.env.SENDER_NAME || 'AI Doc Assistant';

  // 1. Try Brevo REST API (HTTPS Port 443 - Bypasses Render outbound SMTP port blocking)
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

      console.log(`  ✅ Email sent to ${to} via Brevo HTTP API (Port 443)`);
      return true;
    } catch (err) {
      console.error(`  ❌ Failed to send email via Brevo API:`, err.message);
    }
  }

  // 2. Try Resend REST API (HTTPS Port 443 - Bypasses Render outbound SMTP port blocking)
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${senderName} <${process.env.RESEND_FROM || 'onboarding@resend.dev'}>`,
          to: [to],
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Resend API HTTP ${response.status}`);
      }

      console.log(`  ✅ Email sent to ${to} via Resend HTTP API (Port 443)`);
      return true;
    } catch (err) {
      console.error(`  ❌ Failed to send email via Resend API:`, err.message);
    }
  }

  // 3. Fallback to SMTP (Gmail / Custom SMTP - For local dev or VPS where SMTP ports 587/465 are open)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const host = process.env.SMTP_HOST;
      const port = parseInt(process.env.SMTP_PORT || '587', 10);

      const transporter = nodemailer.createTransport(
        host
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

      console.log(`  ✅ Email sent to ${to} via SMTP`);
      return true;
    } catch (err) {
      console.error(`  ❌ Failed to send email via SMTP:`, err.message);
    }
  }

  console.log('  ⚠️  No active email provider (BREVO_API_KEY, RESEND_API_KEY, or SMTP credentials) succeeded.');
  return false;
}

module.exports = { sendEmail };
