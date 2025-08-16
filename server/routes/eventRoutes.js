import express from 'express';
import { createEvent } from '../controllers/eventController.js';
import { joinEvent } from '../controllers/eventController.js';
import userAuth from '../middleware/userAuth.js';

const router = express.Router();

router.post('/create', userAuth, createEvent);
router.post('/join', userAuth, joinEvent);

export default router;