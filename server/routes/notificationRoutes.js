import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { getMyNotifications, markAsRead } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/my-notifications', userAuth, getMyNotifications);
router.put('/read', userAuth, markAsRead);

export default router;