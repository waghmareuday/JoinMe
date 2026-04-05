import Redis from 'ioredis';

/**
 * Redis Client Configuration
 * 
 * Provides a singleton Redis client with:
 * - Automatic reconnection with exponential backoff
 * - Graceful fallback when Redis is unavailable (app still works, just uncached)
 * - Connection health monitoring
 * 
 * Set REDIS_URL in .env (defaults to localhost:6379)
 * Examples:
 *   REDIS_URL=redis://localhost:6379
 *   REDIS_URL=redis://:password@redis-host:6379
 *   REDIS_URL=rediss://default:token@fly-redis.upstash.io:6379  (TLS)
 */

let redis = null;
let isRedisReady = false;

function createRedisClient() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 10) {
        console.warn('[Redis] Max retries reached. Giving up reconnection.');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
    enableReadyCheck: true,
    lazyConnect: false,
    connectTimeout: 10000,
    // Key prefix to avoid collisions in shared Redis instances
    keyPrefix: 'joinme:',
  });

  client.on('connect', () => {
    console.log('[Redis] Connected');
  });

  client.on('ready', () => {
    isRedisReady = true;
    console.log('[Redis] Ready');
  });

  client.on('error', (err) => {
    // Only log once, not on every retry
    if (isRedisReady) {
      console.error('[Redis] Connection lost:', err.message);
    }
    isRedisReady = false;
  });

  client.on('close', () => {
    isRedisReady = false;
  });

  return client;
}

/**
 * Get the singleton Redis client
 */
export function getRedisClient() {
  if (!redis) {
    redis = createRedisClient();
  }
  return redis;
}

/**
 * Check if Redis is currently available
 */
export function isRedisAvailable() {
  return isRedisReady;
}

/**
 * Create a duplicate client for pub/sub (Socket.io adapter needs separate pub + sub clients)
 */
export function createRedisSubClient() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  return new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 10) return null;
      return Math.min(times * 200, 5000);
    },
    keyPrefix: 'joinme:',
  });
}

// ============================================
// HIGH-LEVEL CACHING API
// ============================================

const DEFAULT_TTL = 300; // 5 minutes

/**
 * Get a cached value, or compute and cache it
 * @param {string} key - Cache key
 * @param {Function} fetcher - Async function that returns the value if cache miss
 * @param {number} ttlSeconds - Time-to-live in seconds (default: 300)
 * @returns {Promise<any>} - Cached or freshly computed value
 */
export async function cacheGet(key, fetcher, ttlSeconds = DEFAULT_TTL) {
  if (!isRedisReady) {
    // Redis down — fall through to fetcher (graceful degradation)
    return fetcher();
  }

  try {
    const cached = await redis.get(key);
    if (cached !== null) {
      return JSON.parse(cached);
    }

    const value = await fetcher();
    // Don't cache null/undefined results
    if (value !== null && value !== undefined) {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    }
    return value;
  } catch (err) {
    console.warn('[Redis] cacheGet error, falling back to fetcher:', err.message);
    return fetcher();
  }
}

/**
 * Invalidate (delete) one or more cache keys
 * @param {...string} keys - Cache keys to invalidate
 */
export async function cacheInvalidate(...keys) {
  if (!isRedisReady || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch (err) {
    console.warn('[Redis] cacheInvalidate error:', err.message);
  }
}

/**
 * Invalidate all keys matching a pattern (e.g., "events:Mumbai:*")
 * Uses SCAN to avoid blocking Redis
 * @param {string} pattern - Glob pattern
 */
export async function cacheInvalidatePattern(pattern) {
  if (!isRedisReady) return;
  try {
    const stream = redis.scanStream({ match: pattern, count: 100 });
    const pipeline = redis.pipeline();
    let count = 0;

    for await (const keys of stream) {
      for (const key of keys) {
        // Strip the keyPrefix since del will auto-add it
        pipeline.del(key.replace(/^joinme:/, ''));
        count++;
      }
    }

    if (count > 0) {
      await pipeline.exec();
    }
  } catch (err) {
    console.warn('[Redis] cacheInvalidatePattern error:', err.message);
  }
}

// ============================================
// TOKEN BLACKLIST (for logout/revocation)
// ============================================

/**
 * Blacklist a JWT token (e.g., on logout)
 * @param {string} token - The JWT token to blacklist
 * @param {number} expiresInSeconds - TTL matching the token's remaining lifetime
 */
export async function blacklistToken(token, expiresInSeconds) {
  if (!isRedisReady) return;
  try {
    await redis.setex(`blacklist:${token}`, expiresInSeconds, '1');
  } catch (err) {
    console.warn('[Redis] blacklistToken error:', err.message);
  }
}

/**
 * Check if a token has been blacklisted
 * @param {string} token - The JWT token to check
 * @returns {Promise<boolean>}
 */
export async function isTokenBlacklisted(token) {
  if (!isRedisReady) return false; // If Redis is down, allow (fail-open)
  try {
    const result = await redis.get(`blacklist:${token}`);
    return result === '1';
  } catch {
    return false;
  }
}

export default getRedisClient;
