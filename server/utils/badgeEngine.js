import Badge, { BADGE_CATALOG } from '../models/badgeModel.js';
import Event from '../models/eventModel.js';
import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';

/**
 * Check and grant all eligible badges for a user.
 * Called after rating, event completion, profile updates, etc.
 * @param {string} userId
 * @param {object} io - Socket.io instance (optional, for real-time notification)
 * @returns {Array} Newly earned badges
 */
export async function checkAndGrantBadges(userId, io = null) {
  const user = await User.findById(userId).lean();
  if (!user) return [];

  // Get already-earned badges
  const existingBadges = await Badge.find({ user: userId }).select('badgeId').lean();
  const earnedSet = new Set(existingBadges.map(b => b.badgeId));

  // Count events joined (for social_butterfly) — use $elemMatch for correct per-element matching
  const joinedCount = await Event.countDocuments({
    requests: { $elemMatch: { user: userId, status: 'approved' } },
    creator: { $ne: userId },
  });

  const newBadges = [];

  for (const [badgeId, config] of Object.entries(BADGE_CATALOG)) {
    if (earnedSet.has(badgeId)) continue; // Already earned

    let earned = false;

    if (badgeId === 'social_butterfly') {
      earned = joinedCount >= 10;
    } else if (config.condition) {
      earned = config.condition(user);
    }

    if (earned) {
      try {
        const badge = new Badge({ user: userId, badgeId });
        await badge.save();
        newBadges.push({ badgeId, ...config, earnedAt: badge.earnedAt });

        // Send notification
        const notif = new Notification({
          recipient: userId,
          type: 'system',
          message: `🏅 You earned the "${config.name}" badge! ${config.icon}`,
        });
        await notif.save();

        if (io) {
          io.to(`user:${userId}`).emit('newNotification', notif);
          io.to(`user:${userId}`).emit('badgeEarned', {
            badgeId,
            name: config.name,
            icon: config.icon,
            tier: config.tier,
          });
        }
      } catch (err) {
        // Duplicate key = already earned (race condition protection)
        if (err.code !== 11000) {
          console.error(`Badge grant error for ${badgeId}:`, err.message);
        }
      }
    }
  }

  return newBadges;
}

/**
 * Get all badges for a user (earned + catalog for display)
 */
export async function getUserBadges(userId) {
  const earned = await Badge.find({ user: userId }).lean();
  const earnedMap = {};
  for (const b of earned) {
    earnedMap[b.badgeId] = b.earnedAt;
  }

  const allBadges = Object.entries(BADGE_CATALOG).map(([id, config]) => ({
    id,
    name: config.name,
    description: config.description,
    icon: config.icon,
    tier: config.tier,
    earned: !!earnedMap[id],
    earnedAt: earnedMap[id] || null,
  }));

  return allBadges;
}
