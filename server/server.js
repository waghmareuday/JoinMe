import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import http from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import connectDB from './config/mongodb.js';
import { getRedisClient, createRedisSubClient, isRedisAvailable } from './config/redis.js';
import errorHandler from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { startCronJobs } from './utils/cronJobs.js';
import sanitize from 'sanitize-html';

import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import eventRouter from './routes/eventRoutes.js';
import notificationRouter from './routes/notificationRoutes.js';
import paymentRouter from './routes/paymentRoutes.js';
import commentRouter from './routes/commentRoutes.js';
import reportRouter from './routes/reportRoutes.js';
import activityRouter from './routes/activityRoutes.js';
import badgeRouter from './routes/badgeRoutes.js';
import followRouter from './routes/followRoutes.js';
import calendarRouter from './routes/calendarRoutes.js';
import analyticsRouter from './routes/analyticsRoutes.js';

import './models/userModel.js';

// Create app
const app = express();
const PORT = process.env.PORT || 4000;

// Connect to database
connectDB();

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://joinme-theta.vercel.app',
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Parse bodies and cookies
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Global rate limiter
app.use('/api', apiLimiter);

// Routes
app.get('/', (req, res) => res.send('JoinMe API v2.0'));
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/event', eventRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/comments', commentRouter);
app.use('/api/reports', reportRouter);
app.use('/api/activity', activityRouter);
app.use('/api/badges', badgeRouter);
app.use('/api/follow', followRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/analytics', analyticsRouter);

// Global error handler (must be AFTER routes)
app.use(errorHandler);

// Socket.io setup with Redis adapter for horizontal scaling
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  }
});

// Attach Redis adapter to Socket.io (graceful fallback if Redis unavailable)
try {
  if (isRedisAvailable()) {
    const pubClient = getRedisClient();
    const subClient = createRedisSubClient();
    io.adapter(createAdapter(pubClient, subClient));
    console.log('[Socket.io] Redis adapter attached — horizontal scaling enabled');
  } else {
    console.log('[Socket.io] Running with in-memory adapter (Redis not available)');
  }
} catch (err) {
  console.warn('[Socket.io] Redis adapter setup failed, using in-memory:', err.message);
}

// Socket authentication map: socketId -> userId
const socketUserMap = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // FIXED: Single joinUser handler that joins BOTH room formats for compatibility
  socket.on('joinUser', (userId) => {
    if (!userId) return;
    socketUserMap.set(socket.id, String(userId));
    socket.join(String(userId));           // For legacy notification compatibility
    socket.join(`user:${userId}`);         // For new features (ratings, reminders)
    console.log(`[Socket] ${socket.id} joined user rooms for: ${userId}`);
  });
  
  socket.on('joinCity', async (city) => {
    try {
      if (!city) return;
      const room = `city:${city}`;
      socket.join(room);

      const eventModel = (await import('./models/eventModel.js')).default;
      const agg = await eventModel.aggregate([
        { $match: { city: city, status: { $in: ['upcoming', 'live'] } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $project: { category: '$_id', count: 1, _id: 0 } }
      ]);
      socket.emit('categoryCountsUpdated', { categories: agg });
    } catch (err) {
      console.error('[Socket] joinCity error:', err.message);
    }
  });

  socket.on('leaveCity', (city) => {
    if (!city) return;
    socket.leave(`city:${city}`);
  });

  // Event chat
  socket.on('joinEventChat', (eventId) => {
    if (!eventId) return;
    socket.join(`event:${eventId}`);
  });

  socket.on('leaveEventChat', (eventId) => {
    if (!eventId) return;
    socket.leave(`event:${eventId}`);
  });

  // FIXED: Chat messages now verify sender identity via socket auth map
  socket.on('sendMessage', async (data) => {
    try {
      const { eventId, senderId, text } = data;
      
      // Security: Verify the sender matches the authenticated socket user
      const authenticatedUserId = socketUserMap.get(socket.id);
      if (!authenticatedUserId || authenticatedUserId !== String(senderId)) {
        console.warn(`[Socket] Unauthorized sendMessage attempt from ${socket.id}`);
        return;
      }

      // Sanitize message text
      const sanitizedText = sanitize(text?.trim() || '', { allowedTags: [], allowedAttributes: {} });
      if (!sanitizedText) return;
      
      const Message = (await import('./models/messageModel.js')).default;
      const User = (await import('./models/userModel.js')).default;
      const Event = (await import('./models/eventModel.js')).default;

      // Verify user is a member of this event
      const event = await Event.findById(eventId).lean();
      if (!event) return;
      
      const isHost = String(event.creator) === String(senderId);
      const isApproved = event.requests?.some(
        r => String(r.user) === String(senderId) && r.status === 'approved'
      );
      
      if (!isHost && !isApproved) {
        console.warn(`[Socket] Non-member trying to send message to event ${eventId}`);
        return;
      }

      const newMessage = new Message({ event: eventId, sender: senderId, text: sanitizedText });
      await newMessage.save();

      const populatedMessage = await Message.findById(newMessage._id).populate({
        path: 'sender', model: User, select: 'name'
      });

      io.to(`event:${eventId}`).emit('receiveMessage', populatedMessage);
    } catch (error) {
      console.error("[Socket] sendMessage error:", error.message);
    }
  });

  socket.on('disconnect', () => {
    socketUserMap.delete(socket.id);
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

// Attach io instance to app for use in routes
app.set('io', io);

// Start cron jobs (auto-expire, reminders, recurring events, fraud detection)
startCronJobs(io);

// Start the server
server.listen(PORT, () => {
  console.log(`JoinMe server running on port ${PORT}`);
});
