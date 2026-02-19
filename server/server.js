import express, { json } from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import connectDB from './config/mongodb.js';

import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import eventRouter from './routes/eventRoutes.js';
import './models/userModel.js';
import notificationRouter from './routes/notificationRoutes.js';
import paymentRouter from './routes/paymentRoutes.js';


// ✅ Step 1: Create app
const app = express();
const PORT = process.env.PORT || 4000;

// ✅ Step 2: Setup middleware
connectDB();
app.use(json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

// ✅ Step 3: Setup routes
app.get('/', (req, res) => {
  res.send('API is working fine');
});
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/event', eventRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/payment', paymentRouter);

// ✅ Step 4: Setup Socket.io
import http from 'http';
import { Server } from 'socket.io';

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }
});

io.on('connection', (socket) => {
  console.log('⚡ A user connected:', socket.id);
  socket.on('joinUser', (userId) => {
    socket.join(String(userId));
    console.log(`Socket ${socket.id} joined personal room: ${userId}`);
  });
  
  socket.on('joinCity', async (city) => {
    try {
      if (!city) return;
      const room = `city:${city}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);

      // Send current category counts for this city only to the joining socket
      const eventModel = (await import('./models/eventModel.js')).default;
      const agg = await eventModel.aggregate([
        { $match: { city: city } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $project: { category: '$_id', count: 1, _id: 0 } }
      ]);

      socket.emit('categoryCountsUpdated', { categories: agg });
    } catch (err) {
      console.error('Error in joinCity handler:', err.message);
    }
  });

  socket.on('leaveCity', (city) => {
    if (!city) return;
    const room = `city:${city}`;
    socket.leave(room);
    console.log(`Socket ${socket.id} left room ${room}`);
  });

  // 🟢 Allow clients to join a per-user room so they can receive personal updates (ratings, notifications)
  socket.on('joinUser', (userId) => {
    if (!userId) return;
    const room = `user:${userId}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined User Room: ${room}`);
  });

  // 🟢 EVENT CHAT LOGIC
  socket.on('joinEventChat', (eventId) => {
    if (!eventId) return;
    const room = `event:${eventId}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined Chat Room: ${room}`);
  });

  socket.on('leaveEventChat', (eventId) => {
    if (!eventId) return;
    const room = `event:${eventId}`;
    socket.leave(room);
    console.log(`Socket ${socket.id} left Chat Room: ${room}`);
  });

  socket.on('sendMessage', async (data) => {
    try {
      const { eventId, senderId, text } = data;
      
      // Dynamic imports to prevent circular dependency issues
      const Message = (await import('./models/messageModel.js')).default;
      const User = (await import('./models/userModel.js')).default;

      // Save the message to the database
      const newMessage = new Message({
        event: eventId,
        sender: senderId,
        text: text
      });
      await newMessage.save();

      // Populate the sender's name so the frontend knows who sent it
      const populatedMessage = await Message.findById(newMessage._id).populate({
        path: 'sender',
        model: User,
        select: 'name'
      });

      // Instantly broadcast the message ONLY to people inside this specific event's chat room
      io.to(`event:${eventId}`).emit('receiveMessage', populatedMessage);

    } catch (error) {
      console.error("Socket sendMessage error:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// ✅ Step 5: Attach io instance to app
app.set('io', io);

// ✅ Step 6: Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
