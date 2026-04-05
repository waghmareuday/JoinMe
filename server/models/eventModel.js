import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, required: true, enum: ['Cricket', 'Football', 'Volleyball', 'Movie', 'Trip', 'Carpooling', 'Other'] },
  city: { type: String, required: true, trim: true },
  venue: { type: String, required: true, trim: true },
  date: { type: Date, required: true },  // FIXED: Was String, now proper Date
  time: { type: String, required: true, trim: true },
  
  requiredPeople: { type: Number, required: true, min: 1, max: 500 },
  
  requests: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'waitlisted'], default: 'pending' },
    requestedAt: { type: Date, default: Date.now }
  }],
  
  // Waitlist
  waitlist: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    joinedAt: { type: Date, default: Date.now }
  }],
  
  isPaid: { type: Boolean, default: false },
  amount: { type: Number, default: 0, min: 0 },
  notes: { type: String, trim: true },
  
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  
  status: {
    type: String,
    enum: ['upcoming', 'live', 'completed', 'cancelled'],  // FIXED: Added 'live'
    default: 'upcoming'
  },
  
  ratedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
  
  // Recurring events
  isRecurring: { type: Boolean, default: false },
  recurringPattern: { type: String, enum: ['daily', 'weekly', 'biweekly', 'monthly'], default: null },
  
  // Invite link token
  inviteToken: { type: String, default: null, index: true },
  
  // Reminders
  reminderSent: { type: Boolean, default: false },
  
  // Edit history
  lastEditedAt: { type: Date, default: null },
  editCount: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

// Compound indexes for performance
EventSchema.index({ city: 1, status: 1, category: 1 });
EventSchema.index({ creator: 1 });
EventSchema.index({ date: 1, status: 1 });
EventSchema.index({ 'requests.user': 1 });

const Event = mongoose.model('Event', EventSchema);
export default Event;