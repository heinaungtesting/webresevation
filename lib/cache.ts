/**
 * Redis Caching Utility
 *
 * Provides caching capabilities using Redis (Upstash) for improved performance.
 * Falls back to in-memory caching when Redis is not configured.
 *
 * Features:
 * - Automatic serialization/deserialization
 * - TTL (time-to-live) support
 * - Cache invalidation patterns
 * - Stale-while-revalidate pattern
 * - In-memory fallback for development
 */

import { Redis } from '@upstash/redis';

// ============================================================================
// Types
// ============================================================================

export interface CacheOptions {
  /** Time-to-live in seconds */
  ttl?: number;
  /** Cache key prefix */
  prefix?: string;
  /** Enable stale-while-revalidate (return stale data while refreshing) */
  staleWhileRevalidate?: boolean;
  /** Stale time in seconds (how long to serve stale data) */
  staleTime?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// ============================================================================
// Redis Client (Singleton)
// ============================================================================

let redis: Redis | null = null;
let redisInitialized = false;

function getRedis(): Redis | null {
  if (redisInitialized) return redis;

  redisInitialized = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[Cache] Redis not configured, using in-memory cache');
    return null;
  }

  try {
    redis = new Redis({ url, token });
    console.log('[Cache] Redis client initialized');
    return redis;
  } catch (error) {
    console.error('[Cache] Failed to initialize Redis:', error);
    return null;
  }
}

// ============================================================================
// In-Memory Cache (Fallback)
// ============================================================================

const memoryCache = new Map<string, CacheEntry<unknown>>();
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function cleanupMemoryCache(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  const cutoff = now;

  for (const [key, entry] of memoryCache.entries()) {
    if (entry.timestamp + entry.ttl * 1000 < cutoff) {
      memoryCache.delete(key);
    }
  }
}

// ============================================================================
// Cache Operations
// ============================================================================

/**
 * Get a value from cache
 */
export async function cacheGet<T>(
  key: string,
  options: CacheOptions = {}
): Promise<T | null> {
  const { prefix = 'cache' } = options;
  const fullKey = `${prefix}:${key}`;

  const redisClient = getRedis();

  if (redisClient) {
    try {
      const data = await redisClient.get<T>(fullKey);
      return data;
    } catch (error) {
      console.error('[Cache] Redis get error:', error);
    }
  }

  // Fallback to memory cache
  cleanupMemoryCache();
  const entry = memoryCache.get(fullKey) as CacheEntry<T> | undefined;

  if (!entry) return null;

  const now = Date.now();
  const isExpired = entry.timestamp + entry.ttl * 1000 < now;

  if (isExpired) {
    memoryCache.delete(fullKey);
    return null;
  }

  return entry.data;
}

/**
 * Set a value in cache
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  const { ttl = 300, prefix = 'cache' } = options; // Default 5 minutes
  const fullKey = `${prefix}:${key}`;

  const redisClient = getRedis();

  if (redisClient) {
    try {
      await redisClient.set(fullKey, value, { ex: ttl });
      return;
    } catch (error) {
      console.error('[Cache] Redis set error:', error);
    }
  }

  // Fallback to memory cache
  memoryCache.set(fullKey, {
    data: value,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Delete a value from cache
 */
export async function cacheDelete(
  key: string,
  options: CacheOptions = {}
): Promise<void> {
  const { prefix = 'cache' } = options;
  const fullKey = `${prefix}:${key}`;

  const redisClient = getRedis();

  if (redisClient) {
    try {
      await redisClient.del(fullKey);
    } catch (error) {
      console.error('[Cache] Redis delete error:', error);
    }
  }

  memoryCache.delete(fullKey);
}

/**
 * Delete all keys matching a pattern
 * Note: Pattern matching only works with Redis
 */
export async function cacheDeletePattern(
  pattern: string,
  options: CacheOptions = {}
): Promise<void> {
  const { prefix = 'cache' } = options;
  const fullPattern = `${prefix}:${pattern}`;

  const redisClient = getRedis();

  if (redisClient) {
    try {
      // Use SCAN to find matching keys (safer than KEYS for production)
      let cursor = 0;
      do {
        const [newCursor, keys] = await redisClient.scan(cursor, {
          match: fullPattern,
          count: 100,
        });
        cursor = Number(newCursor);

        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } while (cursor !== 0);
    } catch (error) {
      console.error('[Cache] Redis delete pattern error:', error);
    }
  }

  // Clear matching keys from memory cache
  const regex = new RegExp(`^${fullPattern.replace(/\*/g, '.*')}$`);
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }
}

// ============================================================================
// Cache-Aside Pattern (Get or Compute)
// ============================================================================

/**
 * Get from cache or compute and store
 * Implements the cache-aside pattern
 */
export async function cacheGetOrSet<T>(
  key: string,
  compute: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try to get from cache
  const cached = await cacheGet<T>(key, options);
  if (cached !== null) {
    return cached;
  }

  // Compute the value
  const value = await compute();

  // Store in cache (fire and forget)
  cacheSet(key, value, options).catch((error) => {
    console.error('[Cache] Failed to set cache:', error);
  });

  return value;
}

// ============================================================================
// Pre-configured Cache Functions
// ============================================================================

/**
 * Cache for session data (shorter TTL)
 */
export const sessionCache = {
  get: <T>(key: string) => cacheGet<T>(key, { prefix: 'session', ttl: 60 }),
  set: <T>(key: string, value: T) =>
    cacheSet(key, value, { prefix: 'session', ttl: 60 }),
  delete: (key: string) => cacheDelete(key, { prefix: 'session' }),
  getOrSet: <T>(key: string, compute: () => Promise<T>) =>
    cacheGetOrSet(key, compute, { prefix: 'session', ttl: 60 }),
};

/**
 * Cache for sport centers (longer TTL - rarely changes)
 */
export const sportCenterCache = {
  get: <T>(key: string) =>
    cacheGet<T>(key, { prefix: 'sport-center', ttl: 3600 }),
  set: <T>(key: string, value: T) =>
    cacheSet(key, value, { prefix: 'sport-center', ttl: 3600 }),
  delete: (key: string) => cacheDelete(key, { prefix: 'sport-center' }),
  getOrSet: <T>(key: string, compute: () => Promise<T>) =>
    cacheGetOrSet(key, compute, { prefix: 'sport-center', ttl: 3600 }),
  invalidateAll: () => cacheDeletePattern('*', { prefix: 'sport-center' }),
};

/**
 * Cache for user profiles (medium TTL)
 */
export const userCache = {
  get: <T>(key: string) => cacheGet<T>(key, { prefix: 'user', ttl: 300 }),
  set: <T>(key: string, value: T) =>
    cacheSet(key, value, { prefix: 'user', ttl: 300 }),
  delete: (key: string) => cacheDelete(key, { prefix: 'user' }),
  getOrSet: <T>(key: string, compute: () => Promise<T>) =>
    cacheGetOrSet(key, compute, { prefix: 'user', ttl: 300 }),
};

// ============================================================================
// Cache Key Generators
// ============================================================================

/**
 * Generate a cache key for session listings
 */
export function sessionListKey(params: Record<string, string | number | boolean | null>): string {
  const sortedParams = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  return `list:${sortedParams || 'all'}`;
}

/**
 * Generate a cache key for a single session
 */
export function sessionKey(id: string): string {
  return `detail:${id}`;
}

/**
 * Generate a cache key for user profile
 */
export function userProfileKey(userId: string): string {
  return `profile:${userId}`;
}

// ============================================================================
// Cache Statistics (for monitoring)
// ============================================================================

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  type: 'redis' | 'memory';
  memoryEntries: number;
  redisConnected: boolean;
}> {
  const redisClient = getRedis();

  return {
    type: redisClient ? 'redis' : 'memory',
    memoryEntries: memoryCache.size,
    redisConnected: redisClient !== null,
  };
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return getRedis() !== null;
}

/**
 * Clear all caches (use with caution)
 */
export async function clearAllCaches(): Promise<void> {
  const redisClient = getRedis();

  if (redisClient) {
    try {
      await redisClient.flushdb();
    } catch (error) {
      console.error('[Cache] Failed to flush Redis:', error);
    }
  }

  memoryCache.clear();
}
