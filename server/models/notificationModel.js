import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user', 
    required: true,
    index: true
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user' 
  },
  type: { 
    type: String, 
    enum: [
      'request_received', 'request_approved', 'request_rejected', 
      'event_cancelled', 'event_completed', 'event_reminder',
      'event_updated', 'waitlist_promoted', 'guest_removed',
      'user_rated', 'smart_match', 'system'
    ],
    required: true 
  },
  message: { type: String, required: true },
  relatedEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);