import cron from 'node-cron';
import Event from '../models/eventModel.js';
import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';
import { sendEventCompletedEmail } from '../config/nodemailer.js';
import { checkAndGrantBadges } from './badgeEngine.js';

// Auto-expire past events: runs every hour
export const startCronJobs = (io) => {
  // ==========================================
  // 1. AUTO-EXPIRE EVENTS PAST THEIR DATE
  // ==========================================
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const expiredEvents = await Event.find({
        status: { $in: ['upcoming', 'live'] },
        date: { $lt: now },
      }).populate('requests.user', 'name email').populate('creator', 'name');

      for (const event of expiredEvents) {
        event.status = 'completed';
        await event.save();

        // Increment host's eventsCompleted counter
        await User.findByIdAndUpdate(event.creator?._id || event.creator, { $inc: { eventsCompleted: 1 } });

        // Notify approved guests
        const approvedGuests = event.requests
          .filter(r => r.status === 'approved' && r.user?.email)
          .map(r => r.user);

        for (const guest of approvedGuests) {
          try {
            await sendEventCompletedEmail(guest.email, guest.name, {
              title: event.title,
              hostName: event.creator?.name || 'Host',
            });
          } catch (emailErr) {
            console.error(`Failed to send completion email to ${guest.email}:`, emailErr.message);
          }
        }

        console.log(`[CRON] Auto-completed event: ${event.title} (${event._id})`);
      }

      if (expiredEvents.length > 0) {
        console.log(`[CRON] Auto-expired ${expiredEvents.length} past events`);
      }
    } catch (err) {
      console.error('[CRON] Auto-expire error:', err.message);
    }
  });

  // ==========================================
  // 2. EVENT REMINDERS (1 hour before)
  // ==========================================
  cron.schedule('*/15 * * * *', async () => {
    try {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000);

      const upcomingEvents = await Event.find({
        status: 'upcoming',
        date: { $gte: now, $lte: oneHourFromNow },
        reminderSent: { $ne: true },
      }).populate('requests.user', 'name email').populate('creator', 'name');

      for (const event of upcomingEvents) {
        const approvedGuests = event.requests
          .filter(r => r.status === 'approved' && r.user)
          .map(r => r.user);

        // Notify host
        const hostNotif = new Notification({
          recipient: event.creator._id,
          type: 'event_reminder',
          message: `Reminder: Your event "${event.title}" starts in ~1 hour!`,
          relatedEvent: event._id,
        });
        await hostNotif.save();
        if (io) io.to(`user:${event.creator._id}`).emit('newNotification', hostNotif);

        // Notify approved guests
        for (const guest of approvedGuests) {
          const notif = new Notification({
            recipient: guest._id,
            type: 'event_reminder',
            message: `Reminder: "${event.title}" starts in ~1 hour! Get ready!`,
            relatedEvent: event._id,
          });
          await notif.save();
          if (io) io.to(`user:${guest._id}`).emit('newNotification', notif);
        }

        event.reminderSent = true;
        await event.save();
        console.log(`[CRON] Sent reminders for event: ${event.title}`);
      }
    } catch (err) {
      console.error('[CRON] Reminder error:', err.message);
    }
  });

  // ==========================================
  // 3. RECURRING EVENT GENERATOR (daily at midnight)
  // ==========================================
  cron.schedule('0 0 * * *', async () => {
    try {
      const now = new Date();
      const recurringEvents = await Event.find({
        isRecurring: true,
        status: { $in: ['completed'] },
      }).populate('creator', 'name');

      for (const event of recurringEvents) {
        let nextDate = new Date(event.date);
        
        switch (event.recurringPattern) {
          case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
          case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
          case 'biweekly': nextDate.setDate(nextDate.getDate() + 14); break;
          case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
          default: continue;
        }

        // Only create if the next date is in the future
        if (nextDate <= now) continue;

        // Check if this recurring event was already generated
        const existing = await Event.findOne({
          creator: event.creator._id,
          title: event.title,
          date: nextDate,
        });
        if (existing) continue;

        const newEvent = new Event({
          title: event.title,
          description: event.description,
          category: event.category,
          city: event.city,
          venue: event.venue,
          date: nextDate,
          time: event.time,
          requiredPeople: event.requiredPeople,
          isPaid: event.isPaid,
          amount: event.amount,
          notes: event.notes,
          creator: event.creator._id,
          status: 'upcoming',
          isRecurring: true,
          recurringPattern: event.recurringPattern,
          requests: [],
        });

        await newEvent.save();
        console.log(`[CRON] Created recurring event: ${newEvent.title} for ${nextDate.toISOString()}`);

        // Emit to city room
        if (io) {
          const populated = await Event.findById(newEvent._id)
            .populate('creator', 'name averageRating totalRatings');
          io.to(`city:${newEvent.city}`).emit('newEvent', populated);
        }
      }
    } catch (err) {
      console.error('[CRON] Recurring event error:', err.message);
    }
  });

  // ==========================================
  // 4. FRAUD DETECTION (daily at 3am)
  // ==========================================
  cron.schedule('0 3 * * *', async () => {
    try {
      // Flag users who create events but never complete them (3+ cancelled in a row)
      const suspiciousHosts = await Event.aggregate([
        { $match: { status: 'cancelled' } },
        { $group: { _id: '$creator', cancelCount: { $sum: 1 } } },
        { $match: { cancelCount: { $gte: 3 } } },
      ]);

      for (const host of suspiciousHosts) {
        const totalEvents = await Event.countDocuments({ creator: host._id });
        const cancelRate = host.cancelCount / totalEvents;

        if (cancelRate > 0.5) {
          console.log(`[FRAUD] Suspicious host ${host._id}: ${host.cancelCount}/${totalEvents} events cancelled (${(cancelRate * 100).toFixed(0)}%)`);
          // Auto-lower trust score for serial cancellers (clamp to 0 minimum)
          const user = await User.findById(host._id).select('trustScore');
          if (user) {
            user.trustScore = Math.max(0, (user.trustScore || 50) - 5);
            await user.save();
          }
        }
      }
    } catch (err) {
      console.error('[CRON] Fraud detection error:', err.message);
    }
  });

  // ==========================================
  // 5. REPUTATION DECAY (weekly, Sundays at 2am)
  // ==========================================
  cron.schedule('0 2 * * 0', async () => {
    try {
      // Users who haven't hosted or joined events in 30+ days get trust score decay
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Find users with trust score > 30 who haven't had any event activity recently
      const allUsers = await User.find({ trustScore: { $gt: 30 } }).select('_id trustScore').lean();
      
      let decayedCount = 0;
      for (const u of allUsers) {
        const recentActivity = await Event.countDocuments({
          $or: [
            { creator: u._id, createdAt: { $gte: thirtyDaysAgo } },
            { 'requests.user': u._id, 'requests.requestedAt': { $gte: thirtyDaysAgo } },
          ],
        });

        if (recentActivity === 0) {
          // Decay: -2 points per week of inactivity, floor at 30
          const newScore = Math.max(30, u.trustScore - 2);
          if (newScore < u.trustScore) {
            await User.findByIdAndUpdate(u._id, { trustScore: newScore });
            decayedCount++;
          }
        }
      }

      if (decayedCount > 0) {
        console.log(`[CRON] Reputation decay applied to ${decayedCount} inactive users`);
      }
    } catch (err) {
      console.error('[CRON] Reputation decay error:', err.message);
    }
  });

  // ==========================================
  // 6. STALE EVENT CLEANUP (daily at 4am)
  // ==========================================
  cron.schedule('0 4 * * *', async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Find stale events: upcoming, 0 requests, created > 7 days ago
      const staleEvents = await Event.find({
        status: 'upcoming',
        createdAt: { $lt: sevenDaysAgo },
        $or: [
          { requests: { $size: 0 } },
          { requests: { $exists: false } },
        ],
      }).select('_id title creator city').lean();

      for (const event of staleEvents) {
        await Event.findByIdAndUpdate(event._id, { status: 'cancelled' });

        // Increment host's eventsCancelled counter
        await User.findByIdAndUpdate(event.creator, { $inc: { eventsCancelled: 1 } });

        // Notify host
        const notif = new Notification({
          recipient: event.creator,
          type: 'system',
          message: `Your event "${event.title}" was auto-archived due to no interest after 7 days.`,
          relatedEvent: event._id,
        });
        await notif.save();
        if (io) io.to(`user:${event.creator}`).emit('newNotification', notif);
      }

      if (staleEvents.length > 0) {
        console.log(`[CRON] Auto-archived ${staleEvents.length} stale events`);
      }
    } catch (err) {
      console.error('[CRON] Stale cleanup error:', err.message);
    }
  });

  // ==========================================
  // 7. BADGE CHECK SWEEP (daily at 1am)
  // ==========================================
  cron.schedule('0 1 * * *', async () => {
    try {
      // Check badges for recently active users
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentEvents = await Event.find({
        $or: [
          { createdAt: { $gte: oneDayAgo } },
          { 'requests.requestedAt': { $gte: oneDayAgo } },
        ],
      }).select('creator requests').lean();

      const userIds = new Set();
      for (const event of recentEvents) {
        userIds.add(String(event.creator));
        for (const req of (event.requests || [])) {
          userIds.add(String(req.user));
        }
      }

      let newBadgeCount = 0;
      for (const uid of userIds) {
        const badges = await checkAndGrantBadges(uid, io);
        newBadgeCount += badges.length;
      }

      if (newBadgeCount > 0) {
        console.log(`[CRON] Badge sweep: granted ${newBadgeCount} new badges to ${userIds.size} users`);
      }
    } catch (err) {
      console.error('[CRON] Badge sweep error:', err.message);
    }
  });

  console.log('[CRON] All cron jobs started (7 jobs)');
};
