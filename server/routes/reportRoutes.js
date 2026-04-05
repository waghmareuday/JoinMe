import express from 'express';
import userAuth from '../middleware/userAuth.js';
import Report from '../models/reportModel.js';
import User from '../models/userModel.js';

const router = express.Router();

// POST /api/reports - Report a user
router.post('/', userAuth, async (req, res) => {
  try {
    const { targetUserId, reason, description, relatedEvent } = req.body;
    const reporterId = req.user.id;

    if (String(reporterId) === String(targetUserId)) {
      return res.status(400).json({ success: false, message: 'You cannot report yourself' });
    }

    // Check for existing report from same reporter for same target
    const existingReport = await Report.findOne({ reporter: reporterId, targetUser: targetUserId, status: 'pending' });
    if (existingReport) {
      return res.status(400).json({ success: false, message: 'You have already reported this user. It is under review.' });
    }

    const report = new Report({
      reporter: reporterId,
      targetUser: targetUserId,
      reason,
      description: description || '',
      relatedEvent: relatedEvent || undefined,
    });

    await report.save();
    res.status(201).json({ success: true, message: 'Report submitted. We will review it shortly.' });
  } catch (error) {
    console.error('Report user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/reports/block - Block a user
router.post('/block', userAuth, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.user.id;

    if (String(userId) === String(targetUserId)) {
      return res.status(400).json({ success: false, message: 'You cannot block yourself' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const alreadyBlocked = user.blockedUsers?.some(b => String(b.blockedUser) === String(targetUserId));
    if (alreadyBlocked) {
      return res.status(400).json({ success: false, message: 'User is already blocked' });
    }

    user.blockedUsers.push({ blockedUser: targetUserId });
    await user.save();

    res.status(200).json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/reports/unblock - Unblock a user
router.post('/unblock', userAuth, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.blockedUsers = user.blockedUsers.filter(b => String(b.blockedUser) !== String(targetUserId));
    await user.save();

    res.status(200).json({ success: true, message: 'User unblocked' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/reports/blocked-users - Get blocked users list
router.get('/blocked-users', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('blockedUsers.blockedUser', 'name')
      .lean();

    res.status(200).json({ success: true, blockedUsers: user?.blockedUsers || [] });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
