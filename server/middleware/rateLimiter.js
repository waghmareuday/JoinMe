import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient, isRedisAvailable } from '../config/redis.js';

/**
 * Create a Redis-backed rate limit store if Redis is available,
 * otherwise falls back to in-memory (default) store.
 */
function createStore(prefix) {
  try {
    if (isRedisAvailable()) {
      return new RedisStore({
        sendCommand: (...args) => getRedisClient().call(...args),
        prefix: `rl:${prefix}:`,
      });
    }
  } catch {
    // Fall through to default in-memory store
  }
  return undefined; // express-rate-limit uses MemoryStore by default
}

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('api'),
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Strict limiter for auth routes (login, register, OTP)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('auth'),
  message: { success: false, message: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

// OTP brute-force protection
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('otp'),
  message: { success: false, message: 'Too many OTP attempts. Please wait 10 minutes.' },
});

// Payment limiter
export const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('payment'),
  message: { success: false, message: 'Too many payment attempts. Please slow down.' },
});
