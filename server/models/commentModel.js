import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  event: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true,
    index: true 
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user', 
    required: true 
  },
  text: { 
    type: String, 
    required: true,
    maxLength: 500 
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
  },
}, { timestamps: true });

commentSchema.index({ event: 1, createdAt: -1 });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
