import express from 'express';
import crypto from 'crypto';
import Event from '../models/eventModel.js';
import userAuth from '../middleware/userAuth.js'; 
import User from '../models/userModel.js';
import { sendEventTicketEmail } from '../config/nodemailer.js';
import Message from '../models/messageModel.js';
import Notification from '../models/notificationModel.js';
import Activity from '../models/activityModel.js';
import { rankEventsForUser, getRecommendations } from '../utils/smartMatch.js';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.js';
import sanitize from 'sanitize-html';
import { sendEventCompletedEmail, sendEventCancelledEmail } from "../config/nodemailer.js";
import { checkAndGrantBadges } from '../utils/badgeEngine.js';

const router = express.Router();

// ==========================================
// 1. CREATE EVENT
// ==========================================
router.post('/create', userAuth, invalidateCache('events', 'categories', 'trending', 'analytics'), async (req, res) => {
  try {
    const eventData = req.body;

    // Validate required fields
    const required = ['title', 'category', 'city', 'venue', 'date', 'time', 'requiredPeople'];
    for (const field of required) {
      if (!eventData[field]) {
        return res.status(400).json({ success: false, message: `${field} is required` });
      }
    }

    // JM-015: Validate paid event amount
    if (eventData.isPaid && (!eventData.amount || Number(eventData.amount) <= 0)) {
        return res.status(400).json({ success: false, message: 'Amount is required for paid events' });
    }

    // Validate date is in the future
    const eventDate = new Date(eventData.date);
    if (eventDate < new Date()) {
      return res.status(400).json({ success: false, message: 'Event date must be in the future' });
    }

    const newEvent = new Event({
      ...eventData,
      creator: req.user.id,
      status: 'upcoming',
      requests: [],
      inviteToken: crypto.randomBytes(16).toString('hex'),
    });

    const savedEvent = await newEvent.save();

    // Update host stats
    await User.findByIdAndUpdate(req.user.id, { $inc: { eventsHosted: 1 } });

    // Create activity feed entry
    const creator = await User.findById(req.user.id).select('name').lean();
    Activity.create({
      type: 'event_created',
      actor: req.user.id,
      message: `${creator?.name || 'Someone'} created "${eventData.title}"`,
      relatedEvent: savedEvent._id,
      city: eventData.city,
    }).catch(() => {}); // Non-blocking

    // Asynchronous Socket Update
    const io = req.app.get('io');
    if (io) {
      Event.aggregate([
        { $match: { city: eventData.city, status: { $in: ['upcoming', 'live'] } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $project: { category: '$_id', count: 1, _id: 0 } }
      ]).then(agg => {
        io.to(`city:${eventData.city}`).emit('categoryCountsUpdated', { categories: agg });
      }).catch(() => {});
      
      Event.findById(savedEvent._id)
        .populate({ path: 'creator', model: User, select: 'name averageRating totalRatings' })
        .lean()
        .then(populatedEvent => {
          io.to(`city:${eventData.city}`).emit('newEvent', populatedEvent);
        }).catch(() => {});
    }

    res.status(201).json({ success: true, message: "Event created!", event: savedEvent });
  } catch (error) {
    console.error('Create event error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 2. EDIT EVENT (Host only)
// ==========================================
router.put('/edit/:eventId', userAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (String(event.creator) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Only the host can edit this event' });
    }

    if (['completed', 'cancelled'].includes(event.status)) {
      return res.status(400).json({ success: false, message: 'Cannot edit a completed or cancelled event' });
    }

    // Limit edits to prevent abuse
    if (event.editCount >= 5) {
      return res.status(400).json({ success: false, message: 'Maximum edit limit reached (5)' });
    }

    const allowedFields = ['title', 'description', 'venue', 'date', 'time', 'requiredPeople', 'notes', 'category'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    updates.lastEditedAt = new Date();

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { $set: updates, $inc: { editCount: 1 } },
      { new: true, runValidators: true }
    ).populate({ path: 'creator', model: User, select: 'name averageRating totalRatings' });

    // Notify approved guests about the update
    const approvedGuests = event.requests.filter(r => r.status === 'approved');
    const io = req.app.get('io');
    
    for (const guest of approvedGuests) {
      const notif = new Notification({
        recipient: guest.user,
        sender: userId,
        type: 'event_updated',
        message: `The event "${event.title}" has been updated by the host`,
        relatedEvent: eventId,
      });
      await notif.save();
      const populatedNotif = await Notification.findById(notif._id).populate('sender', 'name').populate('relatedEvent', 'title').lean();
      if (io) io.to(`user:${guest.user}`).emit('newNotification', populatedNotif);
    }

    res.status(200).json({ success: true, message: 'Event updated', event: updatedEvent });
  } catch (error) {
    console.error('Edit event error:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// ==========================================
// 3. REQUEST TO JOIN EVENT
// ==========================================
router.post('/request/:id', userAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    const userId = req.user.id; 

    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    if (!['upcoming', 'live'].includes(event.status)) {
      return res.status(400).json({ success: false, message: "Event is no longer accepting requests" });
    }

    if (String(event.creator) === String(userId)) {
      return res.status(400).json({ success: false, message: "You are the host of this event!" });
    }

    // Check if blocked by creator
    const creator = await User.findById(event.creator).select('blockedUsers').lean();
    if (creator?.blockedUsers?.some(b => String(b.blockedUser) === String(userId))) {
      return res.status(403).json({ success: false, message: "You cannot join this event" });
    }

    const approvedCount = event.requests.filter(r => r.status === 'approved').length;
    
    const existingRequest = event.requests.find(r => String(r.user) === String(userId));
    if (existingRequest) {
      if (existingRequest.status === 'pending') return res.status(400).json({ success: false, message: "Your request is already pending approval." });
      if (existingRequest.status === 'approved') return res.status(400).json({ success: false, message: "You are already approved for this event!" });
      if (existingRequest.status === 'waitlisted') return res.status(400).json({ success: false, message: "You are on the waitlist." });
      // Allow re-request for rejected users
      if (existingRequest.status === 'rejected') {
        existingRequest.status = 'pending';
        await event.save();

        const notif = new Notification({
          recipient: event.creator,
          sender: userId,
          type: 'request_received',
          message: `Someone re-requested to join: ${event.title}`,
          relatedEvent: event._id,
        });
        await notif.save();
        const populatedNotif = await Notification.findById(notif._id).populate('sender', 'name').populate('relatedEvent', 'title').lean();
        const io = req.app.get('io');
        if (io) io.to(`user:${event.creator}`).emit('newNotification', populatedNotif);

        return res.status(200).json({ success: true, message: "Re-request sent to host!" });
      }
    }

    // If event is full, add to waitlist
    if (approvedCount >= event.requiredPeople) {
      event.requests.push({ user: userId, status: 'waitlisted' });
      if (!event.waitlist) event.waitlist = [];
      event.waitlist.push({ user: userId, joinedAt: new Date() });
      await event.save();

      return res.status(200).json({ success: true, message: "Event is full. You've been added to the waitlist!", waitlisted: true });
    }

    event.requests.push({ user: userId, status: 'pending' });
    await event.save();

    const newNotif = new Notification({
      recipient: event.creator,
      sender: userId,          
      type: 'request_received',
      message: `Someone wants to join your event: ${event.title}`,
      relatedEvent: event._id
    });
    await newNotif.save();
    const populatedNotif = await Notification.findById(newNotif._id).populate('sender', 'name').populate('relatedEvent', 'title').lean();

    const io = req.app.get('io');
    if (io) io.to(`user:${event.creator}`).emit('newNotification', populatedNotif);

    res.status(200).json({ success: true, message: "Request sent to host successfully!" });
  } catch (error) {
    console.error("Request to join error:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ==========================================
// 4. JOIN VIA INVITE TOKEN
// ==========================================
router.post('/join-invite/:token', userAuth, async (req, res) => {
  try {
    const event = await Event.findOne({ inviteToken: req.params.token });
    const userId = req.user.id;

    if (!event) return res.status(404).json({ success: false, message: 'Invalid invite link' });
    if (!['upcoming', 'live'].includes(event.status)) {
      return res.status(400).json({ success: false, message: 'Event is no longer accepting members' });
    }
    if (String(event.creator) === String(userId)) {
      return res.status(400).json({ success: false, message: 'You are the host!' });
    }

    const existing = event.requests.find(r => String(r.user) === String(userId));
    if (existing && existing.status === 'approved') {
      return res.status(400).json({ success: false, message: 'You are already in this event' });
    }

    const approvedCount = event.requests.filter(r => r.status === 'approved').length;
    if (approvedCount >= event.requiredPeople) {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }

    if (existing) {
      existing.status = 'approved';
    } else {
      event.requests.push({ user: userId, status: 'approved' });
    }
    await event.save();

    // Notify host
    const notif = new Notification({
      recipient: event.creator,
      sender: userId,
      type: 'guest_joined_via_invite',
      message: `Someone joined via invite link: ${event.title}`,
      relatedEvent: event._id,
    });
    await notif.save();

    res.status(200).json({ success: true, message: 'You have joined the event!', eventId: event._id });
  } catch (error) {
    console.error('Join invite error:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// ==========================================
// 5. RESPOND TO REQUEST (Approve/Reject)
// ==========================================
router.put('/respond/:eventId', userAuth, async (req, res) => {
  try {
    const { userId, status } = req.body;
    const eventId = req.params.eventId;
    const hostId = req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'approved' or 'rejected'" });
    }

    const event = await Event.findById(eventId).populate({
      path: 'requests.user',
      model: User, 
      select: 'name email'
    });

    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    if (String(event.creator) !== String(hostId)) {
      return res.status(403).json({ success: false, message: "Only the host can manage requests." });
    }

    const requestIndex = event.requests.findIndex(r => r.user && String(r.user._id || r.user) === String(userId));
    if (requestIndex === -1) return res.status(404).json({ success: false, message: "User request not found." });

    if (status === 'approved') {
      const approvedCount = event.requests.filter(r => r.status === 'approved').length;
      if (approvedCount >= event.requiredPeople) {
        return res.status(400).json({ success: false, message: "Cannot approve. The event is already full!" });
      }
    }

    event.requests[requestIndex].status = status;
    await event.save();

    // Create notification for the user
    const notifType = status === 'approved' ? 'request_approved' : 'request_rejected';
    const notifMessage = status === 'approved' 
      ? `Your request to join "${event.title}" was approved!`
      : `Your request to join "${event.title}" was declined.`;

    const notif = new Notification({
      recipient: userId,
      sender: hostId,
      type: notifType,
      message: notifMessage,
      relatedEvent: event._id,
    });
    await notif.save();
    const populatedNotif = await Notification.findById(notif._id).populate('sender', 'name').populate('relatedEvent', 'title').lean();

    const io = req.app.get('io');
    if (io) io.to(`user:${userId}`).emit('newNotification', populatedNotif);

    if (status === 'approved') {
      const requestingUser = event.requests[requestIndex].user;
      const hostUser = await User.findById(hostId).select('name').lean();

      if (requestingUser && requestingUser.email) {
         sendEventTicketEmail(
           requestingUser.email, 
           requestingUser.name, 
           {
             title: event.title,
             date: event.date,
             time: event.time,
             venue: event.venue,
             city: event.city,
             hostName: hostUser ? hostUser.name : 'The Host'
           },
           event._id.toString(),
           requestingUser._id.toString()
         ).catch(err => console.error('Email failed:', err));
      }
    }

    if (io) io.to(`city:${event.city}`).emit('eventUpdated', { eventId: event._id }); 

    res.status(200).json({ success: true, message: `User has been ${status}!` });
  } catch (error) {
    console.error("Respond Error:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ==========================================
// 6. REMOVE GUEST (Host only)
// ==========================================
router.put('/remove-guest/:eventId', userAuth, async (req, res) => {
  try {
    const { userId } = req.body;
    const hostId = req.user.id;
    const event = await Event.findById(req.params.eventId);

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (String(event.creator) !== String(hostId)) {
      return res.status(403).json({ success: false, message: 'Only the host can remove guests' });
    }

    const requestIndex = event.requests.findIndex(r => String(r.user) === String(userId));
    if (requestIndex === -1) return res.status(404).json({ success: false, message: 'Guest not found' });

    event.requests.splice(requestIndex, 1);
    await event.save();

    // Notify removed guest
    const notif = new Notification({
      recipient: userId,
      sender: hostId,
      type: 'guest_removed',
      message: `You were removed from "${event.title}"`,
      relatedEvent: event._id,
    });
    await notif.save();
    const populatedNotif = await Notification.findById(notif._id).populate('sender', 'name').populate('relatedEvent', 'title').lean();

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${userId}`).emit('newNotification', populatedNotif);
      io.to(`user:${userId}`).emit('removedFromEvent', { eventId: event._id });
    }

    // Smart Waitlist Promotion: promote the highest trust-score user instead of FIFO
    const approvedCount = event.requests.filter(r => r.status === 'approved').length;
    if (approvedCount < event.requiredPeople) {
      const waitlistedRequests = event.requests.filter(r => r.status === 'waitlisted');
      if (waitlistedRequests.length > 0) {
        // Fetch trust scores for all waitlisted users
        const waitlistedUserIds = waitlistedRequests.map(r => r.user);
        const waitlistedUsers = await User.find({ _id: { $in: waitlistedUserIds } })
          .select('_id trustScore averageRating')
          .lean();

        // Sort by trust score (desc), then by rating (desc)
        waitlistedUsers.sort((a, b) => {
          const scoreDiff = (b.trustScore || 0) - (a.trustScore || 0);
          return scoreDiff !== 0 ? scoreDiff : (b.averageRating || 0) - (a.averageRating || 0);
        });

        const bestCandidate = waitlistedUsers[0];
        if (bestCandidate) {
          const bestRequest = event.requests.find(r => String(r.user) === String(bestCandidate._id) && r.status === 'waitlisted');
          if (bestRequest) {
            bestRequest.status = 'pending';
            // Also remove from legacy waitlist array
            event.waitlist = (event.waitlist || []).filter(w => String(w) !== String(bestCandidate._id) && String(w.user || w) !== String(bestCandidate._id));

            const promoteNotif = new Notification({
              recipient: bestCandidate._id,
              sender: hostId,
              type: 'waitlist_promoted',
              message: `A spot opened up for "${event.title}"! Your request is now pending review.`,
              relatedEvent: event._id,
            });
            await promoteNotif.save();
            const populatedNotif = await Notification.findById(promoteNotif._id).populate('sender', 'name').populate('relatedEvent', 'title').lean();
            if (io) io.to(`user:${bestCandidate._id}`).emit('newNotification', populatedNotif);
          }
        }
        await event.save();
      }
    }

    res.status(200).json({ success: true, message: 'Guest removed' });
  } catch (error) {
    console.error('Remove guest error:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// ==========================================
// 7. GET MY EVENTS (Dashboard Pipeline) - PAGINATED
// ==========================================
router.get('/my-events', userAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {
      $or: [
        { creator: userId },
        { 'requests.user': userId } 
      ]
    };

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate({ path: 'creator', model: User, select: 'name averageRating totalRatings' })
        .populate({ path: 'requests.user', model: User, select: 'name email' }) 
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter),
    ]);

    // JM-003: Privacy Fix — Only host should see guest emails
    const sanitizedEvents = events.map(event => {
      const isHost = String(event.creator._id || event.creator) === String(userId);
      if (!isHost && event.requests) {
        event.requests = event.requests.map(req => {
          if (req.user && req.user.email) {
            delete req.user.email;
          }
          return req;
        });
      }
      return event;
    });

    res.status(200).json({ 
      success: true, 
      events: sanitizedEvents, 
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error("Error fetching user events:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ==========================================
// 8. UPDATE EVENT STATUS (Complete/Cancel) (JM-012: Inlined)
// ==========================================
router.put('/status', userAuth, async (req, res) => {
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

    const event = await Event.findById(eventId)
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
      await User.findByIdAndUpdate(userId, { $inc: { eventsCompleted: 1 } });
      const host = await User.findById(userId);
      if (host && typeof host.computeTrustScore === 'function') {
        host.computeTrustScore();
        await host.save();
      }
      const io = req.app.get('io');
      checkAndGrantBadges(userId, io).catch(() => {});
      const guestIds = event.requests
        .filter(r => r.status === 'approved' && r.user)
        .map(r => r.user._id || r.user);
      for (const gId of guestIds) {
        checkAndGrantBadges(String(gId), io).catch(() => {});
      }
    } else if (newStatus === 'cancelled') {
      await User.findByIdAndUpdate(userId, { $inc: { eventsCancelled: 1 } });
      const host = await User.findById(userId);
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
      const populatedNotif = await Notification.findById(notif._id).populate('sender', 'name').populate('relatedEvent', 'title').lean();
      const io = req.app.get('io');
      if (io) io.to(`user:${guest._id}`).emit('newNotification', populatedNotif);
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
        const eventDetails = { 
          title: event.title, 
          hostName: event.creator.name, 
          date: event.date,
          time: event.time,
          venue: event.venue,
          city: event.city
        };
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
});

// ==========================================
// 9. GET ALL EVENTS (Explore Hub) - PAGINATED
// ==========================================
router.get('/all', cacheMiddleware(60, 'events'), async (req, res) => {
  try {
    const { city, category, search, date } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    let query = {
      status: { $nin: ['completed', 'cancelled'] }
    };
    
    if (city) query.city = { $regex: new RegExp(`^${city.trim()}$`, 'i') };
    if (category && category !== 'All') query.category = category;
    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d.setUTCHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setUTCHours(23, 59, 59, 999));
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    if (search) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } }
      ];
    }

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate({ path: 'creator', model: User, select: 'name averageRating totalRatings' })
        .populate({ path: 'requests.user', model: User, select: 'name' }) 
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(query),
    ]);

    // Filter out events with deleted creators
    const filtered = events.filter(e => e.creator !== null);

    res.status(200).json({ 
      success: true, 
      events: filtered, 
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error("Error in /all route:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ==========================================
// 10. GET CATEGORIES
// ==========================================
router.get('/categories', cacheMiddleware(120, 'categories'), async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) return res.status(400).json({ success: false, message: "City is required" });

    const sanitizedCity = city.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const categories = await Event.aggregate([
      { 
        $match: { 
          city: { $regex: new RegExp(`^${sanitizedCity}$`, 'i') },
          status: { $nin: ['completed', 'cancelled'] } 
        } 
      },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } }
    ]);

    res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error("Error in /categories route:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ==========================================
// 11. GET SINGLE EVENT (for invite link landing)
// ==========================================
router.get('/single/:eventId', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate({ path: 'creator', model: User, select: 'name averageRating totalRatings' })
      .lean();

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    res.status(200).json({ success: true, event });
  } catch (error) {
    console.error('Get single event error:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// ==========================================
// 12. GET CHAT MESSAGES - PAGINATED
// ==========================================
router.get('/chat/:eventId', userAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const event = await Event.findById(eventId).lean();
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    const isHost = String(event.creator) === String(userId);
    const isApprovedGuest = event.requests.some(
      (r) => String(r.user._id || r.user) === String(userId) && r.status === 'approved'
    );

    if (!isHost && !isApprovedGuest) {
      return res.status(403).json({ success: false, message: "You are not authorized to view this chat." });
    }

    const [messages, total] = await Promise.all([
      Message.find({ event: eventId })
        .populate({ path: 'sender', model: User, select: 'name' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments({ event: eventId }),
    ]);

    res.status(200).json({ 
      success: true, 
      messages: messages.reverse(), // Return in chronological order
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error("Fetch messages error:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ==========================================
// 13. GET INVITE TOKEN (Host only)
// ==========================================
router.get('/invite-token/:eventId', userAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).select('creator inviteToken').lean();
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (String(event.creator) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Only the host can get invite links' });
    }
    res.status(200).json({ success: true, inviteToken: event.inviteToken });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// ==========================================
// 14. SMART FEED — Ranked events for authenticated user
// ==========================================
router.get('/smart-feed', userAuth, async (req, res) => {
  try {
    const { city, category, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    let query = { status: { $nin: ['completed', 'cancelled'] } };
    if (city) query.city = { $regex: new RegExp(`^${city.trim()}$`, 'i') };
    if (category && category !== 'All') query.category = category;
    if (search) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const events = await Event.find(query)
      .populate({ path: 'creator', model: User, select: 'name averageRating totalRatings trustScore age' })
      .populate({ path: 'requests.user', model: User, select: 'name' })
      .lean();

    // Filter ghost events
    const valid = events.filter(e => e.creator !== null);

    // Rank using Smart Match algorithm
    const ranked = await rankEventsForUser(req.user.id, valid);

    // Paginate after ranking
    const total = ranked.length;
    const start = (page - 1) * limit;
    const paginated = ranked.slice(start, start + limit);

    res.status(200).json({
      success: true,
      events: paginated,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Smart feed error:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// ==========================================
// 15. FOR YOU — Top personalized recommendations
// ==========================================
router.get('/recommendations', userAuth, async (req, res) => {
  try {
    const { city } = req.query;
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 10));

    const recommendations = await getRecommendations(req.user.id, city, limit);

    res.status(200).json({
      success: true,
      events: recommendations,
      meta: { algorithm: 'smart-match-v1', factors: ['categoryAffinity', 'hostReliability', 'freshness', 'socialProof', 'demographicFit', 'availabilityMatch'] },
    });
  } catch (error) {
    console.error('Recommendations error:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// ==========================================
// 16. TRENDING EVENTS — Most active events in a city
// ==========================================
router.get('/trending', cacheMiddleware(90, 'trending'), async (req, res) => {
  try {
    const { city } = req.query;
    const limit = Math.min(20, parseInt(req.query.limit) || 10);

    const match = { status: { $in: ['upcoming', 'live'] } };
    if (city) match.city = { $regex: new RegExp(`^${city.trim()}$`, 'i') };

    // Trending = most requests + highest fill rate + soonest date
    const events = await Event.find(match)
      .populate({ path: 'creator', model: User, select: 'name averageRating totalRatings' })
      .lean();

    const scored = events
      .filter(e => e.creator)
      .map(event => {
        const approved = event.requests?.filter(r => r.status === 'approved').length || 0;
        const pending = event.requests?.filter(r => r.status === 'pending').length || 0;
        const fillRate = event.requiredPeople > 0 ? approved / event.requiredPeople : 0;
        const hoursUntil = Math.max(1, (new Date(event.date) - new Date()) / (1000 * 60 * 60));
        const urgencyBonus = Math.max(0, 100 - hoursUntil);

        const trendScore = (approved + pending) * 15 + fillRate * 40 + urgencyBonus * 0.3 +
          (event.creator.averageRating || 0) * 5;

        return { ...event, trendScore: Math.round(trendScore) };
      })
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit);

    res.status(200).json({ success: true, events: scored });
  } catch (error) {
    console.error('Trending error:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

export default router;