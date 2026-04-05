import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { getUserBadges, checkAndGrantBadges } from '../utils/badgeEngine.js';
import { BADGE_CATALOG } from '../models/badgeModel.js';

const router = express.Router();

// GET /api/badges/my - Get current user's badges
router.get('/my', userAuth, async (req, res) => {
  try {
    const badges = await getUserBadges(req.user.id);
    res.status(200).json({ success: true, badges });
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/badges/user/:userId - Get any user's badges (public)
router.get('/user/:userId', async (req, res) => {
  try {
    const badges = await getUserBadges(req.params.userId);
    const earned = badges.filter(b => b.earned);
    res.status(200).json({ success: true, badges: earned });
  } catch (error) {
    console.error('Get user badges error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/badges/check - Manually trigger badge check for current user
router.post('/check', userAuth, async (req, res) => {
  try {
    const io = req.app.get('io');
    const newBadges = await checkAndGrantBadges(req.user.id, io);
    res.status(200).json({
      success: true,
      newBadges,
      message: newBadges.length > 0
        ? `Congratulations! You earned ${newBadges.length} new badge(s)!`
        : 'No new badges earned yet. Keep going!',
    });
  } catch (error) {
    console.error('Check badges error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/badges/catalog - Get all available badges
router.get('/catalog', (req, res) => {
  const catalog = Object.entries(BADGE_CATALOG).map(([id, config]) => ({
    id,
    name: config.name,
    description: config.description,
    icon: config.icon,
    tier: config.tier,
  }));
  res.status(200).json({ success: true, catalog });
});

export default router;
