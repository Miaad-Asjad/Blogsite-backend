import express from 'express';
import multer from 'multer';
import passport from 'passport';
import {
  logoutUser,
  loginUser,
  refreshAccessToken,
  requestPasswordReset,
  resetPassword,
  resendVerificationCode,
  verifyEmail,
  registerUser,
} from '../controllers/authController.js';

import { updateUserProfile } from '../controllers/userController.js';
import { upload } from '../middleware/upload.js';
import authenticate from '../middleware/authenticate.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateTokens.js';

const router = express.Router();

// Multer Upload Error Handler
const handleUploadError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(500).json({ message: "Server error during file upload", error: err.message });
  }
  next();
};

// Registration
router.post('/register', upload.single('profilePicture'), handleUploadError, registerUser);

// Login
router.post('/login', loginUser);

// Token Refresh
router.post('/refresh-token', refreshAccessToken);

// Password Reset
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Email Verification
router.post('/verify-email', verifyEmail);
router.post('/resend-code', resendVerificationCode);

// Logout
router.post('/logout', logoutUser);

// Profile Update Route
router.put(
  '/profile',
  authenticate,
  upload.single('profilePicture'),
  handleUploadError,
  updateUserProfile
);

// Google OAuth
router.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

router.get('/auth/google/callback', passport.authenticate('google', {
  session: false,
  failureRedirect: '/login',
}), async (req, res) => {
  try {
    const accessToken = generateAccessToken(req.user);
    const refreshToken = generateRefreshToken(req.user);

    req.user.refreshToken = refreshToken;
    await req.user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${process.env.CLIENT_URL}/google-success?token=${accessToken}`);
  } catch (err) {
    console.error("Google login callback error:", err);
    res.redirect("/login");
  }
});

export default router;
