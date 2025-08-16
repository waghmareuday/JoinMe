import eventModel from "../models/eventModel.js";

export const createEvent = async (req, res) => {
  try {
    const {
      name,
      email,
      category,
      title,
      description,
      eventDateTime,
      venue,
      requiredPeople,
      paymentRequired,
      amount,
      contactPreference,
      contactNumber,
    } = req.body;

    if (
      !name || !email || !category || !title || !eventDateTime ||
      !requiredPeople
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const event = new eventModel({
      name,
      email,
      category,
      title,
      description,
      eventDateTime,
      venue,
      requiredPeople,
      paymentRequired,
      amount: paymentRequired ? amount : 0,
      contactPreference,
      contactNumber: contactPreference !== 'chat' ? contactNumber : '',
    });

    await event.save();

    // 🔥 Emit real-time event creation to all clients
    const io = req.app.get('io');
    io.emit('newEvent', {
      _id: event._id,
      name: event.name,
      email: event.email,
      category: event.category,
      title: event.title,
      eventDateTime: event.eventDateTime,
      venue: event.venue,
      requiredPeople: event.requiredPeople,
      paymentRequired: event.paymentRequired,
      amount: event.amount,
      contactPreference: event.contactPreference,
      contactNumber: event.contactNumber,
      status: event.status,
      datePosted: event.datePosted
    });

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event,
    });

  } catch (err) {
    console.error('Error in createEvent:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};


export const joinEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    const userEmail = req.user.email; // coming from auth middleware

    const event = await eventModel.findById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status !== 'live') {
      return res.status(400).json({ success: false, message: 'Event is not live' });
    }

    if (event.requiredPeople <= 0) {
      event.status = 'full';
      await event.save();
      return res.status(400).json({ success: false, message: 'Event is full' });
    }

    if (event.joinedUsers.includes(userEmail)) {
      return res.status(400).json({ success: false, message: 'You have already joined' });
    }

    event.joinedUsers.push(userEmail);
    event.requiredPeople -= 1;

    if (event.requiredPeople === 0) {
      event.status = 'full';
    }

    await event.save();

    return res.status(200).json({
      success: true,
      message: 'Joined event successfully',
      remainingSlots: event.requiredPeople,
    });

  } catch (err) {
    console.error('Error in joinEvent:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

