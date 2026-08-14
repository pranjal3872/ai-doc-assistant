const prisma = require('../config/database');

function generateOTPCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createOTP(email, type = 'LOGIN') {
  // Invalidate any existing OTPs for this email
  await prisma.oTP.updateMany({
    where: { email, verified: false },
    data: { verified: true },
  });

  const code = generateOTPCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const otp = await prisma.oTP.create({
    data: {
      email,
      code,
      type,
      expiresAt,
    },
  });

  return otp;
}

async function verifyOTPCode(email, code) {
  const otp = await prisma.oTP.findFirst({
    where: {
      email,
      code,
      verified: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) {
    return null;
  }

  // Mark as verified
  await prisma.oTP.update({
    where: { id: otp.id },
    data: { verified: true },
  });

  return otp;
}

const { sendEmail } = require('./emailService');

async function sendOTPEmail(email, code) {
  // Always log OTP to console for debugging
  console.log('\n========================================');
  console.log(`  OTP Code for ${email}: ${code}`);
  console.log('========================================\n');

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8f9fa; border-radius: 12px;">
      <h2 style="color: #1a1a2e; margin-bottom: 8px;">AI Doc Assistant</h2>
      <p style="color: #555; font-size: 15px;">Use the code below to sign in. It expires in 10 minutes.</p>
      <div style="background: #1a1a2e; color: #fff; font-size: 32px; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 8px; margin: 24px 0; font-weight: bold;">
        ${code}
      </div>
      <p style="color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Your OTP Code - AI Doc Assistant',
    html,
  });

  return true;
}

async function sendMagicLinkEmail(email, token) {
  const backendURL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  const link = `${backendURL}/api/auth/magic-link/verify?token=${token}`;

  // Always log to console for debugging
  console.log('\n========================================');
  console.log(`  Magic Link for ${email}:`);
  console.log(`  ${link}`);
  console.log('========================================\n');

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8f9fa; border-radius: 12px;">
      <h2 style="color: #1a1a2e; margin-bottom: 8px;">AI Doc Assistant</h2>
      <p style="color: #555; font-size: 15px;">Click the button below to sign in. This link expires in 15 minutes.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${link}" style="background: #1a1a2e; color: #fff; font-size: 16px; text-decoration: none; padding: 14px 32px; border-radius: 8px; display: inline-block; font-weight: bold;">
          Sign In
        </a>
      </div>
      <p style="color: #888; font-size: 13px;">If the button doesn't work, copy and paste this link:<br/>
        <a href="${link}" style="color: #4a6cf7; word-break: break-all;">${link}</a>
      </p>
      <p style="color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Your Magic Link - AI Doc Assistant',
    html,
  });

  return true;
}

module.exports = {
  generateOTPCode,
  createOTP,
  verifyOTPCode,
  sendOTPEmail,
  sendMagicLinkEmail,
};
