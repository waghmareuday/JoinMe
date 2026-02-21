import express from 'express';
import Event from '../models/eventModel.js';
import userAuth from '../middleware/userAuth.js'; 
import User from '../models/userModel.js';
import { sendEventTicketEmail } from '../config/nodemailer.js';
import Message from '../models/messageModel.js';
import { updateEventStatus } from '../controllers/eventController.js';
import Notification from '../models/notificationModel.js';

const router = express.Router();

// ==========================================
// 1. CREATE EVENT
// ==========================================
router.post('/create', userAuth, async (req, res) => {
  try {
    const eventData = req.body;

    const newEvent = new Event({
      ...eventData,
      creator: req.user.id,
      status: 'upcoming',
      requests: [] 
    });

    const savedEvent = await newEvent.save();

    // 🟢 Asynchronous Socket Update (Prevents blocking the response)
    const io = req.app.get('io');
    if (io) {
      Event.aggregate([
        { $match: { city: eventData.city, status: { $in: ['upcoming', 'live'] } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $project: { category: '$_id', count: 1, _id: 0 } }
      ]).then(agg => {
        io.to(`city:${eventData.city}`).emit('categoryCountsUpdated', { categories: agg });
      }).catch(err => console.error("Socket agg error:", err));
      
      Event.findById(savedEvent._id)
        .populate({ path: 'creator', model: User, select: 'name averageRating totalRatings' })
        .lean()
        .then(populatedEvent => {
          io.to(`city:${eventData.city}`).emit('newEvent', populatedEvent);
        }).catch(err => console.error("Socket pop error:", err));
    }

    // Respond to user instantly
    res.status(201).json({ success: true, message: "Event created!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 2. REQUEST TO JOIN EVENT
// ==========================================
router.post('/request/:id', userAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    const userId = req.user.id; 

    if (!event) return res.status(404).json({ message: "Event not found" });

    if (!['upcoming', 'live'].includes(event.status)) {
      return res.status(400).json({ message: "Event is no longer accepting requests" });
    }

    if (String(event.creator) === String(userId)) {
      return res.status(400).json({ message: "You are the host of this event!" });
    }

    const approvedCount = event.requests.filter(req => req.status === 'approved').length;
    if (approvedCount >= event.requiredPeople) {
      return res.status(400).json({ message: "Event is already full!" });
    }

    const existingRequest = event.requests.find(r => String(r.user) === String(userId));
    if (existingRequest) {
      if (existingRequest.status === 'pending') return res.status(400).json({ message: "Your request is already pending approval." });
      if (existingRequest.status === 'approved') return res.status(400).json({ message: "You are already approved for this event!" });
      if (existingRequest.status === 'rejected') return res.status(400).json({ message: "Your request was declined by the host." });
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

    const io = req.app.get('io');
    if (io) io.to(String(event.creator)).emit('newNotification', newNotif);

    res.status(200).json({ success: true, message: "Request sent to host successfully!" });
  } catch (error) {
    console.error("Request to join error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ==========================================
// 3. RESPOND TO REQUEST (Approve/Reject)
// ==========================================
router.put('/respond/:eventId', userAuth, async (req, res) => {
  try {
    const { userId, status } = req.body;
    const eventId = req.params.eventId;
    const hostId = req.user.id;

    const event = await Event.findById(eventId).populate({
      path: 'requests.user',
      model: User, 
      select: 'name email'
    });

    if (!event) return res.status(404).json({ message: "Event not found" });

    if (String(event.creator) !== String(hostId)) {
      return res.status(403).json({ message: "Only the host can manage requests." });
    }

    const requestIndex = event.requests.findIndex(r => r.user && String(r.user._id || r.user) === String(userId));
    if (requestIndex === -1) return res.status(404).json({ message: "User request not found." });

    if (status === 'approved') {
      const approvedCount = event.requests.filter(r => r.status === 'approved').length;
      if (approvedCount >= event.requiredPeople) {
        return res.status(400).json({ message: "Cannot approve. The event is already full!" });
      }
    }

    event.requests[requestIndex].status = status;
    await event.save();

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
           }
         ).catch(err => console.error('Email failed:', err));
      }
    }

    const io = req.app.get('io');
    if (io) io.to(`city:${event.city}`).emit('newEvent', event); 

    res.status(200).json({ success: true, message: `User has been ${status}!` });
  } catch (error) {
    console.error("Respond Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ==========================================
// 4. GET MY EVENTS (Dashboard Pipeline) - OPTIMIZED ⚡
// ==========================================
router.get('/my-events', userAuth, async (req, res) => {
  try {
    const userId = req.user.id; 
    
    const events = await Event.find({
      $or: [
        { creator: userId },
        { 'requests.user': userId } 
      ]
    })
    .populate({ path: 'creator', model: User, select: 'name averageRating totalRatings' })
    .populate({ path: 'requests.user', model: User, select: 'name email' }) 
    .sort({ date: 1 })
    .lean(); // 🟢 Strips heavy Mongoose metadata for maximum speed

    res.status(200).json({ success: true, events });
  } catch (error) {
    console.error("Error fetching user events:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ==========================================
// 5. UPDATE EVENT STATUS (Complete/Cancel)
// ==========================================
router.put('/status', userAuth, updateEventStatus);

// ==========================================
// 6. GET ALL EVENTS (Explore Hub) - OPTIMIZED ⚡
// ==========================================
router.get('/all', async (req, res) => {
  try {
    const { city, category, search } = req.query;
    
    let query = {
      status: { $nin: ['completed', 'cancelled'] }
    };
    
    if (city) query.city = { $regex: new RegExp(`^${city.trim()}$`, 'i') };
    if (category && category !== 'All') query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    let events = await Event.find(query)
      .populate({ path: 'creator', model: User, select: 'name averageRating totalRatings' })
      .populate({ path: 'requests.user', model: User, select: 'name' }) 
      .sort({ date: 1 })
      .lean(); // 🟢 Turbocharges the Explore feed loading time

    events = events.filter(e => e.creator !== null);

    res.status(200).json({ success: true, events });
  } catch (error) {
    console.error("Error in /all route:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ==========================================
// 7. GET CATEGORIES
// ==========================================
router.get('/categories', async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) return res.status(400).json({ message: "City is required" });

    const categories = await Event.aggregate([
      { 
        $match: { 
          city: { $regex: new RegExp(`^${city.trim()}$`, 'i') },
          status: { $nin: ['completed', 'cancelled'] } 
        } 
      },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } }
    ]);

    res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error("Error in /categories route:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ==========================================
// 8. GET CHAT MESSAGES - OPTIMIZED ⚡
// ==========================================
router.get('/chat/:eventId', userAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(eventId).lean();
    if (!event) return res.status(404).json({ message: "Event not found" });

    const isHost = String(event.creator) === String(userId);
    const isApprovedGuest = event.requests.some(
      (r) => String(r.user._id || r.user) === String(userId) && r.status === 'approved'
    );

    if (!isHost && !isApprovedGuest) {
      return res.status(403).json({ message: "You are not authorized to view this chat." });
    }

    const messages = await Message.find({ event: eventId })
      .populate({ path: 'sender', model: User, select: 'name' })
      .sort({ createdAt: 1 })
      .lean(); // 🟢 Instantly load chat histories

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Fetch messages error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export default router;