import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['event_created', 'event_joined', 'event_completed', 'user_rated', 'event_cancelled'],
    required: true 
  },
  city: { 
    type: String, 
    required: true,
    index: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  relatedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
}, { timestamps: true });

// TTL index: auto-delete activities older than 7 days
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });
activitySchema.index({ city: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
