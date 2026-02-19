import { io } from 'socket.io-client';

// Socket wrapper to provide a stable singleton and helper helpers
const SOCKET_URL = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined'
  ? import.meta.env.VITE_API_URL 
  : 'https://joinme-qf56.onrender.com';
const raw = io(SOCKET_URL, { autoConnect: false, withCredentials: true });

raw.on('connect', () => console.log('Socket connected', raw.id));
raw.on('disconnect', (reason) => console.log('Socket disconnected', reason));
raw.on('connect_error', (err) => console.error('Socket connect_error', err.message));

const socket = {
  connect: () => { if (!raw.connected) raw.connect(); },
  disconnect: () => { if (raw.connected) raw.disconnect(); },
  on: (ev, cb) => raw.on(ev, cb),
  off: (ev, cb) => raw.off(ev, cb),
  emit: (ev, payload) => raw.emit(ev, payload),
  joinCity: (city) => raw.emit('joinCity', city),
  leaveCity: (city) => raw.emit('leaveCity', city),
  // Join a per-user room on the server so this client receives personal updates
  joinUser: (userId) => raw.emit('joinUser', userId),
  raw,
};

export default socket;