import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { getUserData, updateProfile, getPublicProfile, rateUser } from '../controllers/userController.js';
import e from 'express';

const userRouter = express.Router();

userRouter.get('/data', userAuth, getUserData);
userRouter.put('/profile', userAuth, updateProfile);
userRouter.get('/public/:id', getPublicProfile);
userRouter.post('/rate', userAuth, rateUser);

export default userRouter;