import eventModel from "../models/eventModel.js";
import userModel from '../models/userModel.js';
import Notification from '../models/notificationModel.js';
import Activity from '../models/activityModel.js';
import { sendEventCompletedEmail, sendEventCancelledEmail } from "../config/nodemailer.js";
import { checkAndGrantBadges } from '../utils/badgeEngine.js';
import sanitize from 'sanitize-html';

// ==========================================
// 🟢 UPDATE EVENT STATUS (Complete/Cancel)
// ==========================================
// JM-011: Added sanitization and max length for cancelReason
export const updateEventStatus = async (req, res) => {
  try {
    let { eventId, newStatus, cancelReason } = req.body;
    const userId = req.user.id;

    if (!['completed', 'cancelled'].includes(newStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status update' });
    }

    // JM-011: Sanitize and limit cancelReason
    if (cancelReason) {
        cancelReason = sanitize(cancelReason, {
            allowedTags: [],
            allowedAttributes: {}
        }).trim().substring(0, 200);
    }

    const event = await eventModel.findById(eventId)
        .populate('requests.user', 'name email')
        .populate('creator', 'name'); 

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (String(event.creator._id || event.creator) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Only the host can update this event' });
    }

    if (event.status === 'completed' || event.status === 'cancelled') {
        return res.status(400).json({ success: false, message: `Event is already ${event.status}` });
    }

    event.status = newStatus;
    await event.save();

    // Update host stats
    if (newStatus === 'completed') {
      await userModel.findByIdAndUpdate(userId, { $inc: { eventsCompleted: 1 } });
      // Update trust score
      const host = await userModel.findById(userId);
      if (host && typeof host.computeTrustScore === 'function') {
        host.computeTrustScore();
        await host.save();
      }
      // Check badges
      const io = req.app.get('io');
      checkAndGrantBadges(userId, io).catch(() => {});
      const guestIds = event.requests
        .filter(r => r.status === 'approved' && r.user)
        .map(r => r.user._id || r.user);
      for (const gId of guestIds) {
        checkAndGrantBadges(String(gId), io).catch(() => {});
      }
    } else if (newStatus === 'cancelled') {
      await userModel.findByIdAndUpdate(userId, { $inc: { eventsCancelled: 1 } });
      const host = await userModel.findById(userId);
      if (host && typeof host.computeTrustScore === 'function') {
        host.computeTrustScore();
        await host.save();
      }
    }

    // Notify all approved guests
    const approvedGuests = event.requests
        .filter(req => req.status === 'approved' && req.user && req.user.email)
        .map(req => req.user);

    for (const guest of approvedGuests) {
      const notif = new Notification({
        recipient: guest._id,
        sender: userId,
        type: newStatus === 'completed' ? 'event_completed' : 'event_cancelled',
        message: `"${event.title}" has been ${newStatus}${newStatus === 'cancelled' && cancelReason ? ': ' + cancelReason : ''}`,
        relatedEvent: event._id,
      });
      await notif.save();
    }

    // Create activity feed entry
    Activity.create({
      type: newStatus === 'completed' ? 'event_completed' : 'event_cancelled',
      actor: userId,
      message: `"${event.title}" was ${newStatus}`,
      relatedEvent: event._id,
      city: event.city,
    }).catch(() => {});

    if (approvedGuests.length > 0) {
        const eventDetails = { title: event.title, hostName: event.creator.name };
        const emailPromises = approvedGuests.map(async (guest) => {
            if (newStatus === 'completed') {
                return sendEventCompletedEmail(guest.email, guest.name, eventDetails);
            } else if (newStatus === 'cancelled') {
                return sendEventCancelledEmail(guest.email, guest.name, eventDetails, cancelReason);
            }
        });
        await Promise.all(emailPromises).catch(err => console.error('Email batch error:', err));
    }

    return res.status(200).json({ success: true, message: `Event successfully marked as ${newStatus}`, event });
  } catch (err) {
    console.error('Error updating event status:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};