import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { createCheckoutSession, verifyPayment, refundPayment } from '../controllers/paymentController.js';
import { paymentLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/create-checkout-session', userAuth, paymentLimiter, createCheckoutSession);
router.post('/verify-session', userAuth, verifyPayment);
router.post('/refund', userAuth, paymentLimiter, refundPayment);

export default router;