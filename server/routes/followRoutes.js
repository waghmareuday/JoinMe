import express from 'express';
import userAuth from '../middleware/userAuth.js';
import Follow from '../models/followModel.js';
import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';

const router = express.Router();

// POST /api/follow - Follow a user
router.post('/', userAuth, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.user.id;

    if (String(userId) === String(targetUserId)) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId).select('name').lean();
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if already following
    const existing = await Follow.findOne({ follower: userId, following: targetUserId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already following this user' });
    }

    await Follow.create({ follower: userId, following: targetUserId });

    // Notify the followed user
    const followerUser = await User.findById(userId).select('name').lean();
    const notif = new Notification({
      recipient: targetUserId,
      sender: userId,
      type: 'system',
      message: `${followerUser?.name || 'Someone'} started following you!`,
    });
    await notif.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${targetUserId}`).emit('newNotification', notif);
    }

    // Get updated counts
    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: targetUserId }),
      Follow.countDocuments({ follower: userId }),
    ]);

    res.status(200).json({
      success: true,
      message: `Now following ${targetUser.name}`,
      followersCount,
      followingCount,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Already following' });
    }
    console.error('Follow error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/follow/:targetUserId - Unfollow a user
router.delete('/:targetUserId', userAuth, async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user.id;

    const result = await Follow.findOneAndDelete({ follower: userId, following: targetUserId });
    if (!result) {
      return res.status(400).json({ success: false, message: 'You are not following this user' });
    }

    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: targetUserId }),
      Follow.countDocuments({ follower: userId }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Unfollowed successfully',
      followersCount,
      followingCount,
    });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/follow/stats/:userId - Get follow stats for a user
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: userId }),
      Follow.countDocuments({ follower: userId }),
    ]);

    // If authenticated, check if current user follows this user
    let isFollowing = false;
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
        if (decoded?.id) {
          const existing = await Follow.findOne({ follower: decoded.id, following: userId }).lean();
          isFollowing = !!existing;
        }
      } catch (_) {
        // Not authenticated — that's fine
      }
    }

    res.status(200).json({
      success: true,
      followersCount,
      followingCount,
      isFollowing,
    });
  } catch (error) {
    console.error('Follow stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/follow/followers/:userId - Get followers list
router.get('/followers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      Follow.find({ following: userId })
        .populate({ path: 'follower', model: User, select: 'name averageRating city' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Follow.countDocuments({ following: userId }),
    ]);

    res.status(200).json({
      success: true,
      users: followers.map(f => f.follower).filter(Boolean),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/follow/following/:userId - Get following list
router.get('/following/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      Follow.find({ follower: userId })
        .populate({ path: 'following', model: User, select: 'name averageRating city' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Follow.countDocuments({ follower: userId }),
    ]);

    res.status(200).json({
      success: true,
      users: following.map(f => f.following).filter(Boolean),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/follow/feed - Events from people you follow
router.get('/feed', userAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    // Get all users the current user follows
    const following = await Follow.find({ follower: userId }).select('following').lean();
    const followedIds = following.map(f => f.following);

    if (followedIds.length === 0) {
      return res.status(200).json({
        success: true,
        events: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        message: 'Follow some users to see their events here!',
      });
    }

    const Event = (await import('../models/eventModel.js')).default;

    const [events, total] = await Promise.all([
      Event.find({
        creator: { $in: followedIds },
        status: { $in: ['upcoming', 'live'] },
      })
        .populate({ path: 'creator', model: User, select: 'name averageRating totalRatings' })
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments({
        creator: { $in: followedIds },
        status: { $in: ['upcoming', 'live'] },
      }),
    ]);

    res.status(200).json({
      success: true,
      events,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Follow feed error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
