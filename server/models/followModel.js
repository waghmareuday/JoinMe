import mongoose from 'mongoose';

const followSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true,
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true,
  },
}, { timestamps: true });

// A user can only follow another user once
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Efficient lookups for both "who do I follow" and "who follows me"
followSchema.index({ following: 1, createdAt: -1 });

const Follow = mongoose.model('Follow', followSchema);
export default Follow;
