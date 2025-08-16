import express, { json } from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import connectDB from './config/mongodb.js';

import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import eventRouter from './routes/eventRoutes.js';

// ✅ Step 1: Create app
const app = express();
const PORT = process.env.PORT || 4000;

// ✅ Step 2: Setup middleware
connectDB();
app.use(json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// ✅ Step 3: Setup routes
app.get('/', (req, res) => {
  res.send('API is working fine');
});
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/event', eventRouter);

// ✅ Step 4: Setup Socket.io
import http from 'http';
import { Server } from 'socket.io';

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  }
});

io.on('connection', (socket) => {
  console.log('⚡ A user connected:', socket.id);
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
