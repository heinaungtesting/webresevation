/**
 * Rate Limiting Utility
 *
 * Uses Redis (Upstash) for distributed rate limiting in production.
 * Falls back to in-memory store for development or when Redis is unavailable.
 *
 * Environment variables required for Redis:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ============================================================================
// Configuration
// ============================================================================

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit?: number;
  /** Time window in milliseconds */
  windowMs?: number;
  /** Custom key generator function */
  keyGenerator?: (request: Request) => string;
  /** Identifier prefix for this rate limiter */
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when the window resets
}

// ============================================================================
// Redis Client (Singleton)
// ============================================================================

let redisClient: Redis | null = null;
let redisInitialized = false;

function getRedisClient(): Redis | null {
  if (redisInitialized) return redisClient;

  redisInitialized = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      '[RateLimit] Redis not configured. Using in-memory rate limiting. ' +
      'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production.'
    );
    return null;
  }

  try {
    redisClient = new Redis({ url, token });
    console.log('[RateLimit] Redis client initialized successfully');
    return redisClient;
  } catch (error) {
    console.error('[RateLimit] Failed to initialize Redis client:', error);
    return null;
  }
}

// ============================================================================
// Upstash Rate Limiters (Redis-based)
// ============================================================================

// Cache for Upstash rate limiters
const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashRateLimiter(config: RateLimitConfig): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) return null;

  const {
    limit = 10,
    windowMs = 10000,
    prefix = 'ratelimit',
  } = config;

  // Create a unique key for this configuration
  const configKey = `${prefix}:${limit}:${windowMs}`;

  let limiter = upstashLimiters.get(configKey);
  if (!limiter) {
    // Convert milliseconds to seconds for Upstash
    const windowSeconds = Math.ceil(windowMs / 1000);

    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: `@upstash/ratelimit:${prefix}`,
      analytics: true,
    });

    upstashLimiters.set(configKey, limiter);
  }

  return limiter;
}

// ============================================================================
// In-Memory Fallback (for development)
// ============================================================================

interface InMemoryEntry {
  timestamps: number[];
}

const inMemoryStore = new Map<string, InMemoryEntry>();
const CLEANUP_INTERVAL = 60 * 1000;
let lastCleanup = Date.now();

function cleanupOldEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  const cutoff = now - windowMs;
  for (const [key, entry] of inMemoryStore.entries()) {
    entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);
    if (entry.timestamps.length === 0) {
      inMemoryStore.delete(key);
    }
  }
  lastCleanup = now;
}

function checkInMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  cleanupOldEntries(windowMs);

  let entry = inMemoryStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    inMemoryStore.set(key, entry);
  }

  const windowStart = now - windowMs;
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  const reset = entry.timestamps.length > 0
    ? Math.ceil((entry.timestamps[0] + windowMs) / 1000)
    : Math.ceil((now + windowMs) / 1000);

  if (entry.timestamps.length >= limit) {
    return { success: false, limit, remaining: 0, reset };
  }

  entry.timestamps.push(now);
  return {
    success: true,
    limit,
    remaining: limit - entry.timestamps.length,
    reset,
  };
}

// ============================================================================
// Client IP Detection
// ============================================================================

/**
 * Get client IP from request headers
 * Supports common proxy headers (X-Forwarded-For, X-Real-IP, CF-Connecting-IP)
 */
export function getClientIP(request: Request): string {
  const headers = request.headers;

  // Cloudflare
  const cfIP = headers.get('cf-connecting-ip');
  if (cfIP) return cfIP.trim();

  // X-Forwarded-For (from load balancers/proxies)
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  // X-Real-IP
  const realIP = headers.get('x-real-ip');
  if (realIP) return realIP.trim();

  // Vercel
  const vercelIP = headers.get('x-vercel-forwarded-for');
  if (vercelIP) return vercelIP.split(',')[0].trim();

  return 'unknown';
}

function defaultKeyGenerator(request: Request): string {
  return getClientIP(request);
}

// ============================================================================
// Main Rate Limiting Functions
// ============================================================================

/**
 * Check rate limit for a request (async - supports Redis)
 */
export async function checkRateLimitAsync(
  request: Request,
  config: RateLimitConfig = {}
): Promise<RateLimitResult> {
  const {
    limit = 10,
    windowMs = 10000,
    keyGenerator = defaultKeyGenerator,
    prefix = 'api',
  } = config;

  const identifier = keyGenerator(request);
  const key = `${prefix}:${identifier}`;

  // Try Redis first
  const upstashLimiter = getUpstashRateLimiter({ limit, windowMs, prefix });
  if (upstashLimiter) {
    try {
      const result = await upstashLimiter.limit(key);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: Math.ceil(result.reset / 1000),
      };
    } catch (error) {
      console.error('[RateLimit] Redis error, falling back to in-memory:', error);
    }
  }

  // Fallback to in-memory
  return checkInMemoryRateLimit(key, limit, windowMs);
}

/**
 * Synchronous rate limit check (uses in-memory only)
 * Use this for backwards compatibility or when async is not possible
 */
export function checkRateLimit(
  request: Request,
  config: RateLimitConfig = {}
): RateLimitResult {
  const {
    limit = 10,
    windowMs = 10000,
    keyGenerator = defaultKeyGenerator,
    prefix = 'api',
  } = config;

  const identifier = keyGenerator(request);
  const key = `${prefix}:${identifier}`;

  return checkInMemoryRateLimit(key, limit, windowMs);
}

/**
 * Create rate limit headers for the response
 */
export function createRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
    ...(result.success ? {} : {
      'Retry-After': Math.max(1, result.reset - Math.floor(Date.now() / 1000)).toString()
    }),
  };
}

/**
 * Create a 429 Too Many Requests response
 */
function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: Math.max(1, result.reset - Math.floor(Date.now() / 1000)),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...createRateLimitHeaders(result),
      },
    }
  );
}

/**
 * Async rate limit middleware (uses Redis when available)
 */
export async function rateLimitAsync(
  request: Request,
  config: RateLimitConfig = {}
): Promise<Response | null> {
  const result = await checkRateLimitAsync(request, config);
  return result.success ? null : createRateLimitResponse(result);
}

/**
 * Sync rate limit middleware (in-memory only, for backwards compatibility)
 */
export function rateLimit(
  request: Request,
  config: RateLimitConfig = {}
): Response | null {
  const result = checkRateLimit(request, config);
  return result.success ? null : createRateLimitResponse(result);
}

// ============================================================================
// Rate Limiter Factory
// ============================================================================

/**
 * Create a custom rate limiter with specific configuration
 */
export function createRateLimiter(defaultConfig: RateLimitConfig = {}) {
  return {
    /** Async check (uses Redis when available) */
    checkAsync: (request: Request, overrideConfig?: RateLimitConfig) =>
      checkRateLimitAsync(request, { ...defaultConfig, ...overrideConfig }),

    /** Sync check (in-memory only) */
    check: (request: Request, overrideConfig?: RateLimitConfig) =>
      checkRateLimit(request, { ...defaultConfig, ...overrideConfig }),

    /** Async limit middleware (uses Redis when available) */
    limitAsync: (request: Request, overrideConfig?: RateLimitConfig) =>
      rateLimitAsync(request, { ...defaultConfig, ...overrideConfig }),

    /** Sync limit middleware (in-memory only) */
    limit: (request: Request, overrideConfig?: RateLimitConfig) =>
      rateLimit(request, { ...defaultConfig, ...overrideConfig }),

    /** Wrap handler with async rate limiting */
    wrapAsync: (
      handler: (request: Request) => Promise<Response>,
      overrideConfig?: RateLimitConfig
    ) => async (request: Request): Promise<Response> => {
      const response = await rateLimitAsync(request, { ...defaultConfig, ...overrideConfig });
      return response ?? handler(request);
    },

    /** Wrap handler with sync rate limiting */
    wrap: (
      handler: (request: Request) => Promise<Response>,
      overrideConfig?: RateLimitConfig
    ) => async (request: Request): Promise<Response> => {
      const response = rateLimit(request, { ...defaultConfig, ...overrideConfig });
      return response ?? handler(request);
    },
  };
}

// ============================================================================
// Pre-configured Rate Limiters
// ============================================================================

/** Auth endpoints: 10 requests per 10 seconds */
export const authRateLimiter = createRateLimiter({
  limit: 10,
  windowMs: 10 * 1000,
  prefix: 'auth',
});

/** Strict limiter: 5 requests per minute (for sensitive operations like reports) */
export const strictRateLimiter = createRateLimiter({
  limit: 5,
  windowMs: 60 * 1000,
  prefix: 'strict',
});

/** General API: 100 requests per minute */
export const apiRateLimiter = createRateLimiter({
  limit: 100,
  windowMs: 60 * 1000,
  prefix: 'api',
});

/** Heavy operations: 20 requests per minute */
export const heavyRateLimiter = createRateLimiter({
  limit: 20,
  windowMs: 60 * 1000,
  prefix: 'heavy',
});

// ============================================================================
// Test Helpers
// ============================================================================

/** Clear in-memory store (for tests only) */
export function __clearRateLimitStore() {
  if (process.env.NODE_ENV === 'test') {
    inMemoryStore.clear();
    lastCleanup = Date.now();
  }
}

/** Check if Redis is available */
export function isRedisAvailable(): boolean {
  return getRedisClient() !== null;
}
