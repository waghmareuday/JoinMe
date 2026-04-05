import express from 'express';
import userAuth from '../middleware/userAuth.js';
import Event from '../models/eventModel.js';
import User from '../models/userModel.js';
import Follow from '../models/followModel.js';
import Badge from '../models/badgeModel.js';
import Activity from '../models/activityModel.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

/**
 * GET /api/analytics/me - Personal dashboard analytics
 * Comprehensive stats for the authenticated user
 */
router.get('/me', userAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      user,
      eventsHosted,
      eventsJoined,
      eventsCompleted,
      eventsCancelled,
      pendingRequests,
      followersCount,
      followingCount,
      badgeCount,
      recentActivity,
    ] = await Promise.all([
      User.findById(userId).select('name averageRating totalRatings trustScore eventsHosted eventsCompleted eventsCancelled createdAt').lean(),
      Event.countDocuments({ creator: userId }),
      Event.countDocuments({ 'requests.user': userId, 'requests.status': 'approved', creator: { $ne: userId } }),
      Event.countDocuments({ creator: userId, status: 'completed' }),
      Event.countDocuments({ creator: userId, status: 'cancelled' }),
      Event.countDocuments({ creator: userId, 'requests.status': 'pending', status: { $in: ['upcoming', 'live'] } }),
      Follow.countDocuments({ following: userId }),
      Follow.countDocuments({ follower: userId }),
      Badge.countDocuments({ user: userId }),
      Activity.find({ actor: userId }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Category distribution (what categories does user host most)
    const categoryDistribution = await Event.aggregate([
      { $match: { creator: user._id } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
    ]);

    // Monthly event trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Event.aggregate([
      {
        $match: {
          creator: user._id,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          month: { $concat: [{ $toString: '$_id.year' }, '-', { $toString: '$_id.month' }] },
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Completion rate
    const completionRate = eventsHosted > 0
      ? Math.round((eventsCompleted / eventsHosted) * 100)
      : 0;

    // Account age in days
    const accountAgeDays = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    res.status(200).json({
      success: true,
      analytics: {
        overview: {
          eventsHosted,
          eventsJoined,
          eventsCompleted,
          eventsCancelled,
          completionRate,
          pendingRequests,
          averageRating: user.averageRating?.toFixed(1) || '0.0',
          totalRatings: user.totalRatings,
          trustScore: user.trustScore || 50,
          followersCount,
          followingCount,
          badgeCount,
          accountAgeDays,
        },
        categoryDistribution,
        monthlyTrend,
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * GET /api/analytics/city/:city - City-level analytics (public)
 */
router.get('/city/:city', cacheMiddleware(120, 'analytics'), async (req, res) => {
  try {
    const city = req.params.city.trim();
    const cityRegex = new RegExp(`^${city}$`, 'i');

    const [
      totalEvents,
      activeEvents,
      totalUsers,
      categoryDistribution,
      topHosts,
    ] = await Promise.all([
      Event.countDocuments({ city: cityRegex }),
      Event.countDocuments({ city: cityRegex, status: { $in: ['upcoming', 'live'] } }),
      User.countDocuments({ city: cityRegex }),
      Event.aggregate([
        { $match: { city: cityRegex, status: { $in: ['upcoming', 'live'] } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { category: '$_id', count: 1, _id: 0 } },
      ]),
      Event.aggregate([
        { $match: { city: cityRegex } },
        { $group: { _id: '$creator', eventCount: { $sum: 1 } } },
        { $sort: { eventCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            name: '$user.name',
            eventCount: 1,
            averageRating: '$user.averageRating',
            _id: 0,
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        city,
        totalEvents,
        activeEvents,
        totalUsers,
        categoryDistribution,
        topHosts,
      },
    });
  } catch (error) {
    console.error('City analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * GET /api/analytics/leaderboard - Top users by trust score
 */
router.get('/leaderboard', cacheMiddleware(180, 'analytics'), async (req, res) => {
  try {
    const { city } = req.query;
    const limit = Math.min(50, parseInt(req.query.limit) || 20);

    const match = {};
    if (city) match.city = { $regex: new RegExp(`^${city.trim()}$`, 'i') };

    const topUsers = await User.find(match)
      .select('name city averageRating totalRatings trustScore eventsHosted eventsCompleted')
      .sort({ trustScore: -1, averageRating: -1 })
      .limit(limit)
      .lean();

    // Add rank and badge count
    const enriched = await Promise.all(
      topUsers.map(async (user, index) => {
        const badgeCount = await Badge.countDocuments({ user: user._id });
        const followersCount = await Follow.countDocuments({ following: user._id });
        return {
          ...user,
          rank: index + 1,
          badgeCount,
          followersCount,
        };
      })
    );

    res.status(200).json({ success: true, leaderboard: enriched });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
