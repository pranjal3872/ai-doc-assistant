const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateToken, generateMagicToken } = require('../services/tokenService');
const { createOTP, verifyOTPCode, sendOTPEmail, sendMagicLinkEmail } = require('../services/otpService');

// Register User with Password
async function registerUser(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if email already registered
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered. Please use a different email or log in instead.' });
    }

    // Hash password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user in DB
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        provider: 'EMAIL',
      },
    });

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePic: user.profilePic,
        provider: user.provider,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}

// Login User with Password
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'Account created via OAuth/OTP. Please log in using Google OAuth or Email OTP.' });
    }

    // Compare entered password with stored bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePic: user.profilePic,
        provider: user.provider,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}

// Google OAuth callback
async function googleCallback(req, res) {
  try {
    const user = req.user;
    const token = generateToken(user);

    // Redirect to frontend with token
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendURL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
  }
}

// Send OTP
async function sendOTP(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const otp = await createOTP(email, 'LOGIN');
    await sendOTPEmail(email, otp.code);

    res.json({ message: 'OTP sent successfully', email });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
}

// Verify OTP
async function verifyOTP(req, res) {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and OTP code are required' });
    }

    const otp = await verifyOTPCode(email, code);
    if (!otp) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Upsert user
    const user = await prisma.user.upsert({
      where: { email },
      update: { updatedAt: new Date() },
      create: {
        email,
        provider: 'EMAIL',
      },
    });

    const token = generateToken(user);

    res.json({
      message: 'OTP verified successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePic: user.profilePic,
        provider: user.provider,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
}

// Send Magic Link
async function sendMagicLink(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const magicToken = generateMagicToken();

    // Store the magic token as an OTP entry with type MAGIC_LINK
    await prisma.oTP.create({
      data: {
        email,
        code: magicToken,
        type: 'MAGIC_LINK',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });

    await sendMagicLinkEmail(email, magicToken);

    res.json({ message: 'Magic link sent successfully', email });
  } catch (error) {
    console.error('Send magic link error:', error);
    res.status(500).json({ error: 'Failed to send magic link' });
  }
}

// Verify Magic Link
async function verifyMagicLink(req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const otpRecord = await prisma.oTP.findFirst({
      where: {
        code: token,
        type: 'MAGIC_LINK',
        verified: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired magic link' });
    }

    // Mark as used
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Upsert user
    const user = await prisma.user.upsert({
      where: { email: otpRecord.email },
      update: { updatedAt: new Date() },
      create: {
        email: otpRecord.email,
        provider: 'EMAIL',
      },
    });

    const jwtToken = generateToken(user);

    // Redirect to frontend with token
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendURL}/auth/callback?token=${jwtToken}`);
  } catch (error) {
    console.error('Verify magic link error:', error);
    res.status(500).json({ error: 'Failed to verify magic link' });
  }
}

// Get current user
async function getCurrentUser(req, res) {
  try {
    const user = req.user;
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePic: user.profilePic,
        provider: user.provider,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
}

// Logout
async function logout(req, res) {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
}

// Request Password Reset OTP
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ error: 'No account found with this email address' });
    }

    // Create OTP for PASSWORD_RESET
    const otp = await createOTP(email, 'PASSWORD_RESET');
    await sendOTPEmail(email, otp.code);

    res.json({ message: 'Password reset code sent to your email', email });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
}

// Reset Password with OTP Code
async function resetPassword(req, res) {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, reset code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Verify OTP record
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        email,
        code,
        type: 'PASSWORD_RESET',
        verified: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired password reset code' });
    }

    // Mark OTP as verified
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Hash new password using bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password in DB
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, updatedAt: new Date() },
    });

    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
}

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  googleCallback,
  sendOTP,
  verifyOTP,
  sendMagicLink,
  verifyMagicLink,
  getCurrentUser,
  logout,
};
