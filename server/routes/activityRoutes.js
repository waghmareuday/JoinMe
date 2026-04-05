import express from 'express';
import Activity from '../models/activityModel.js';

const router = express.Router();

// GET /api/activity?city=Mumbai&limit=20
router.get('/', async (req, res) => {
  try {
    const { city } = req.query;
    const limit = Math.min(50, parseInt(req.query.limit) || 20);

    const filter = {};
    if (city) filter.city = { $regex: new RegExp(`^${city.trim()}$`, 'i') };

    const activities = await Activity.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({ success: true, activities });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
