import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  event: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true 
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  text: { 
    type: String, 
    required: true 
  }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

const Message = mongoose.model('Message', messageSchema);

export default Message;