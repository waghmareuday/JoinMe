import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {  // Event creator
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['cricket', 'football', 'volleyball', 'movie', 'ride', 'trip'],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,

  // 👇 This is the actual event date & time
  eventDateTime: {
    type: Date,
    required: true,
  },

  venue: String,
  requiredPeople: {
    type: Number,
    required: true,
  },
  joinedUsers: {
    type: [String], // email IDs
    default: [],
  },
  paymentRequired: {
    type: Boolean,
    default: false,
  },
  amount: {
    type: Number,
    default: 0,
  },
  contactPreference: {
    type: String,
    enum: ['chat', 'mobile', 'both'],
    default: 'chat',
  },
  contactNumber: {
    type: String,
  },
  status: {
    type: String,
    enum: ['live', 'full', 'expired'],
    default: 'live',
  },

  // 👇 This is auto-set when event is posted
  datePosted: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('eventModel', eventSchema);
