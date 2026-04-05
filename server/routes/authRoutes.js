import express from 'express';
import { 
  isAuthenticated, 
  login, 
  logout, 
  register, 
  resetPassword, 
  sendOTPEmail, 
  sendResetOTP, 
  verifyOnlyOTP, 
  verifyOTP,
  googleAuth,
} from '../controllers/authController.js';
import userAuth from '../middleware/userAuth.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js';

const authRouter = express.Router();

// Auth routes with rate limiting
authRouter.post('/register', authLimiter, register);
authRouter.post('/login', authLimiter, login);
authRouter.post('/logout', userAuth, logout);
authRouter.post('/send-otp', otpLimiter, sendOTPEmail);
authRouter.post('/verify-otp', otpLimiter, verifyOTP);
authRouter.post('/is-auth', userAuth, isAuthenticated);
authRouter.post('/send-forget-otp', otpLimiter, sendResetOTP);
authRouter.post('/verify-reset-otp', otpLimiter, verifyOnlyOTP);
authRouter.post('/reset-password', authLimiter, resetPassword);

authRouter.get('/check-auth', userAuth, (req, res) => {
  return res.status(200).json({ success: true });
});

// Google OAuth
authRouter.post('/google', authLimiter, googleAuth);

export default authRouter;
