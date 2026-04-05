import { isRedisAvailable, getRedisClient } from '../config/redis.js';

/**
 * Express middleware for Redis response caching.
 * 
 * Usage:
 *   router.get('/events', cacheMiddleware(120, 'events'), getEvents);
 *   // Caches for 120 seconds with key derived from URL + prefix
 * 
 * Features:
 * - Graceful degradation: if Redis is down, passes through to handler
 * - Auto-generates cache keys from URL + query params
 * - Supports custom key prefix for targeted invalidation
 * - Sets X-Cache header (HIT/MISS) for debugging
 */
export function cacheMiddleware(ttlSeconds = 300, keyPrefix = '') {
  return async (req, res, next) => {
    // Skip caching if Redis is unavailable
    if (!isRedisAvailable()) {
      return next();
    }

    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Build cache key from URL (includes query params)
    const cacheKey = `cache:${keyPrefix}:${req.originalUrl}`;
    const redis = getRedisClient();

    try {
      const cached = await redis.get(cacheKey);

      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
    } catch (err) {
      // Redis read error — just proceed to handler
      console.warn('[Cache MW] Read error:', err.message);
    }

    // Override res.json to intercept the response and cache it
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      res.set('X-Cache', 'MISS');

      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redis.setex(cacheKey, ttlSeconds, JSON.stringify(body)).catch((err) => {
          console.warn('[Cache MW] Write error:', err.message);
        });
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Middleware to invalidate cache on mutation (POST/PUT/DELETE)
 * Attach to routes that modify data to clear stale caches.
 * 
 * Usage:
 *   router.post('/event', invalidateCache('events'), createEvent);
 */
export function invalidateCache(...prefixes) {
  return async (req, res, next) => {
    if (!isRedisAvailable()) return next();

    // Override res.json to invalidate after successful response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const redis = getRedisClient();
        // Invalidate all cached keys matching these prefixes
        for (const prefix of prefixes) {
          const pattern = `cache:${prefix}:*`;
          const stream = redis.scanStream({ match: `joinme:${pattern}`, count: 200 });

          stream.on('data', (keys) => {
            if (keys.length) {
              const pipeline = redis.pipeline();
              keys.forEach((key) => pipeline.del(key.replace(/^joinme:/, '')));
              pipeline.exec().catch(() => {});
            }
          });
        }
      }
      return originalJson(body);
    };

    next();
  };
}
