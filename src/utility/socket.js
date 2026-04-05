import { io } from 'socket.io-client';

// Socket wrapper to provide a stable singleton and helper helpers
const SOCKET_URL = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined'
  ? import.meta.env.VITE_API_URL 
  : 'https://joinme-qf56.onrender.com';
let isConnecting = false;
const raw = io(SOCKET_URL, { autoConnect: false, withCredentials: true });

raw.on('connect', () => {
    isConnecting = false;
    console.log('Socket connected', raw.id);
});
raw.on('connect_error', (err) => {
    isConnecting = false;
    console.error('Socket connect_error', err.message);
});
raw.on('disconnect', (reason) => {
    isConnecting = false;
    console.log('Socket disconnected', reason);
});

const socket = {
  connect: () => { 
    if (!raw.connected && !isConnecting) {
      isConnecting = true;
      raw.connect(); 
    }
  },
  disconnect: () => { 
    isConnecting = false;
    if (raw.connected) raw.disconnect(); 
  },
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