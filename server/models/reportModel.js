import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporter: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user', 
    required: true 
  },
  targetUser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user', 
    required: true 
  },
  reason: { 
    type: String, 
    enum: ['spam', 'harassment', 'fraud', 'inappropriate', 'other'],
    required: true 
  },
  description: { 
    type: String, 
    maxLength: 500,
    default: '' 
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending',
  },
  relatedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  },
}, { timestamps: true });

reportSchema.index({ targetUser: 1 });
reportSchema.index({ reporter: 1, targetUser: 1 });

// Block list sub-schema within users
export const blockSchema = new mongoose.Schema({
  blockedUser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user', 
    required: true 
  },
  blockedAt: { type: Date, default: Date.now },
});

const Report = mongoose.model('Report', reportSchema);
export default Report;
