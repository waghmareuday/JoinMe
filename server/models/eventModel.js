import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  city: { type: String, required: true },
  venue: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  
  requiredPeople: { type: Number, required: true },
  
  requests: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'user' // 🟢 CHANGED TO LOWERCASE 'user'
    },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    },
    requestedAt: { type: Date, default: Date.now }
  }],
  
  isPaid: { type: Boolean, default: false },
  amount: { type: Number, default: 0 },
  notes: { type: String }, 
  creator: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user' // 🟢 CHANGED TO LOWERCASE 'user'
  },
  
  // 🟢 NEW: EVENT COMPLETION & RATING TRACKING
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  ratedBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user' // 🟢 CHANGED TO LOWERCASE 'user'
  }], 

  createdAt: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', EventSchema);
export default Event;