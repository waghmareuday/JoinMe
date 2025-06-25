import express from 'express';
import { isAuthenticated, login, logout, register, resetPassword, sendOTPEmail, sendResetOTP, verifyOnlyOTP, verifyOTP } from '../controllers/authController.js';
import userAuth from '../middleware/userAuth.js';
import { send } from 'vite';
import jwt from 'jsonwebtoken';


const { verify } = jwt;

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


export default authRouter;