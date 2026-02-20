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
  diagnoseNetwork
} from '../controllers/authController.js';
import userAuth from '../middleware/userAuth.js';

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.post('/send-otp', sendOTPEmail);
authRouter.post('/verify-otp', verifyOTP);
authRouter.post('/is-auth', userAuth, isAuthenticated);
authRouter.post('/send-forget-otp', sendResetOTP);
authRouter.post('/verify-reset-otp', verifyOnlyOTP);
authRouter.post('/reset-password', resetPassword);
authRouter.get('/diagnose', diagnoseNetwork);

authRouter.get('/check-auth', userAuth, (req, res) => {
  return res.status(200).json({ success: true });
});

export default authRouter;
