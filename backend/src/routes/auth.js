const express = require('express');
const passport = require('../config/passport');
const { authenticateToken } = require('../middleware/auth');
const {
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
} = require('../controllers/authController');

const router = express.Router();

// Email & Password Auth
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      if (err || !user) {
        console.error('Google OAuth error:', err || info);
        return res.redirect(`${frontendURL}/login?error=google_auth_failed`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  googleCallback
);

// Email OTP
router.post('/otp/send', sendOTP);
router.post('/otp/verify', verifyOTP);

// Magic Link
router.post('/magic-link/send', sendMagicLink);
router.get('/magic-link/verify', verifyMagicLink);

// Current user (protected)
router.get('/me', authenticateToken, getCurrentUser);

// Logout
router.post('/logout', authenticateToken, logout);

module.exports = router;
