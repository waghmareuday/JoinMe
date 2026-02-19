import eventModel from "../models/eventModel.js";
import userModel from '../models/userModel.js';
import { sendEventCompletedEmail, sendEventCancelledEmail } from "../config/nodemailer.js";

// ==========================================
// 🟢 1. GET ALL EVENTS (For Explore Hub)
// ==========================================
export const getEvents = async (req, res) => {
  try {
    const { city, category, search } = req.query;
    const filter = {
      status: { $in: ['upcoming', 'live'] } 
    };
    if (city) filter.city = city;
    if (category && category !== 'All') filter.category = category;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];

    let events = await eventModel.find(filter)
      .populate('creator', 'name averageRating totalRatings') 
      .populate('requests.user', 'name email') 
      .sort({ createdAt: -1 });
      
    // Safety Net: Filter out "ghost" events where the creator's account was deleted
    events = events.filter(e => e.creator !== null);

    return res.status(200).json({ success: true, events });
  } catch (err) {
    console.error('Error in getEvents:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==========================================
// 🟢 2. GET MY EVENTS (For Dashboard Pipeline)
// ==========================================
export const getMyEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch events where the user is EITHER the host OR has requested to join
    const events = await eventModel.find({
      $or: [
        { creator: userId },
        { 'requests.user': userId }
      ]
    })
    .populate('creator', 'name averageRating totalRatings')
    .populate('requests.user', 'name email')
    .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, events });
  } catch (err) {
    console.error('Error in getMyEvents:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==========================================
// 🟢 3. GET CATEGORY COUNTS (For Real-Time Badges)
// ==========================================
export const getCategoryCounts = async (req, res) => {
  try {
    const { city } = req.query;
    const match = { status: { $in: ['upcoming', 'live'] } }; // Match explore logic
    if (city) match.city = city;

    const agg = await eventModel.aggregate([
      { $match: match },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } }
    ]);

    return res.status(200).json({ success: true, categories: agg });
  } catch (err) {
    console.error('Error in getCategoryCounts:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==========================================
// 🟢 4. CREATE EVENT
// ==========================================
export const createEvent = async (req, res) => {
  try {
    const { title, description, category, city, venue, date, time, requiredPeople, isPaid, amount, notes } = req.body;

    if (!title || !category || !city || !venue || !date || !time || !requiredPeople) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const event = new eventModel({
      title, description, category, city, venue, date, time, requiredPeople,
      isPaid: isPaid || false,
      amount: isPaid ? amount : 0,
      notes,
      creator: req.user.id, 
      status: 'upcoming',
      requests: []
    });

    await event.save();

    const populatedEvent = await eventModel.findById(event._id)
      .populate('creator', 'name averageRating totalRatings');

    const io = req.app.get('io');
    const room = `city:${event.city}`;
    io.to(room).emit('newEvent', populatedEvent);

    const agg = await eventModel.aggregate([
      { $match: { city: event.city, status: { $in: ['upcoming', 'live'] } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } }
    ]);
    io.to(room).emit('categoryCountsUpdated', { categories: agg });

    return res.status(201).json({ success: true, message: 'Event created successfully', event: populatedEvent });
  } catch (err) {
    console.error('Error in createEvent:', err.message);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ==========================================
// 🟢 5. REQUEST TO JOIN EVENT
// ==========================================
export const joinEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.id; 

    const event = await eventModel.findById(eventId);

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!['upcoming', 'live'].includes(event.status)) return res.status(400).json({ success: false, message: 'Event is no longer accepting requests' });
    if (String(event.creator) === String(userId)) return res.status(400).json({ success: false, message: 'You cannot join your own event' });

    const approvedCount = event.requests.filter(r => r.status === 'approved').length;
    if (approvedCount >= event.requiredPeople) return res.status(400).json({ success: false, message: 'Event is currently full' });

    const existingRequest = event.requests.find(r => String(r.user) === String(userId));
    if (existingRequest) {
      if (existingRequest.status === 'pending') return res.status(400).json({ success: false, message: 'Your request is already pending host approval' });
      if (existingRequest.status === 'approved') return res.status(400).json({ success: false, message: 'You are already approved for this event' });
      if (existingRequest.status === 'rejected') return res.status(400).json({ success: false, message: 'Your previous request was declined' });
    }

    event.requests.push({ user: userId, status: 'pending' });
    await event.save();

    return res.status(200).json({ success: true, message: 'Request sent to host successfully' });
  } catch (err) {
    console.error('Error in joinEvent:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==========================================
// 🟢 6. RESPOND TO REQUEST (Approve/Reject)
// ==========================================
export const respondEventRequest = async (req, res) => {
  try {
    const { eventId } = req.params; 
    const { userId, status } = req.body; // status: 'approved' or 'rejected'
    const hostId = req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // We populate so we can compare IDs safely and get emails
    const event = await eventModel.findById(eventId).populate('requests.user', 'name email');
    
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Ensure the person clicking approve is actually the host
    if (String(event.creator._id || event.creator) !== String(hostId)) {
      return res.status(403).json({ success: false, message: 'Only the host can manage requests' });
    }

    // Safely find the user's request using String comparison on ObjectIds
    const requestIndex = event.requests.findIndex(r => String(r.user._id || r.user) === String(userId));

    if (requestIndex === -1) {
      return res.status(404).json({ success: false, message: 'User request not found in this event' });
    }

    // Update the status
    event.requests[requestIndex].status = status;
    await event.save();

    // NOTE: If you have an approval email template, you can trigger it here using:
    // const guestEmail = event.requests[requestIndex].user.email;

    return res.status(200).json({ success: true, message: `Guest ${status} successfully` });
  } catch (err) {
    console.error('Error in respondEventRequest:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==========================================
// 🟢 7. COMPLETE / CANCEL EVENT
// ==========================================
export const updateEventStatus = async (req, res) => {
  try {
    const { eventId, newStatus, cancelReason } = req.body;
    const userId = req.user.id;

    if (!['completed', 'cancelled'].includes(newStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status update' });
    }

    const event = await eventModel.findById(eventId)
        .populate('requests.user', 'name email')
        .populate('creator', 'name'); 

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (String(event.creator._id) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Only the host can update this event' });
    }

    if (event.status === 'completed' || event.status === 'cancelled') {
        return res.status(400).json({ success: false, message: `Event is already ${event.status}` });
    }

    event.status = newStatus;
    await event.save();

    const approvedGuests = event.requests
        .filter(req => req.status === 'approved' && req.user && req.user.email)
        .map(req => req.user);

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