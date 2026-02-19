import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true // 🟢 Intelligence: Indexing this makes fetching unread counts O(1) fast
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  type: { 
    type: String, 
    enum: ['request_received', 'request_approved', 'request_rejected', 'event_cancelled', 'system'],
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  relatedEvent: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event' 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);