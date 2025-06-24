import express from 'express';
import { isAuthenticated, login, logout, register, sendOTPEmail, sendResetOTP, verifyOTP, verifyResetOTP } from '../controllers/authController.js';
import userAuth from '../middleware/userAuth.js';
import { send } from 'vite';
import jwt from 'jsonwebtoken';


const { verify } = jwt;

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.post('/send-verify-otp', sendOTPEmail);
authRouter.post('/verify-otp', verifyOTP);
authRouter.post('/is-auth', userAuth, isAuthenticated);
authRouter.post('/send-reset-otp', sendResetOTP);
authRouter.post('/reset-password', verifyResetOTP);

export default authRouter;