import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { createCheckoutSession, verifyPayment } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-checkout-session', userAuth, createCheckoutSession);
router.post('/verify-session', userAuth, verifyPayment);

export default router;