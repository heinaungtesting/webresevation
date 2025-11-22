/**
 * Rate Limiting Utility
 *
 * Implements distributed rate limiting using Upstash Redis.
 * Falls back to in-memory store if Upstash is not configured.
 *
 * Required environment variables for production:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Check if Upstash is configured
const isUpstashConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// Create Redis client if configured
const redis = isUpstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Log warning if not configured (only in development)
if (!isUpstashConfigured && process.env.NODE_ENV === 'development') {
  console.warn(
    '[Rate Limit] Upstash not configured. Using in-memory fallback. ' +
    'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production.'
  );
}

// In-memory fallback store
interface RateLimitEntry {
  timestamps: number[];
}
const rateLimitStore = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 60 * 1000;
let lastCleanup = Date.now();

function cleanupOldEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  const cutoff = now - windowMs;
  for (const [key, entry] of rateLimitStore.entries()) {
    entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);
    if (entry.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
  lastCleanup = now;
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit?: number;
  /** Time window in milliseconds */
  windowMs?: number;
  /** Custom key generator function */
  keyGenerator?: (request: Request) => string;
  /** Identifier prefix for Upstash rate limiter */
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when the window resets
}

/**
 * Get client IP from request headers
 * Supports common proxy headers (X-Forwarded-For, X-Real-IP)
 */
function getClientIP(request: Request): string {
  const headers = request.headers;

  // Check X-Forwarded-For (from load balancers/proxies)
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Check X-Real-IP
  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // Check CF-Connecting-IP (Cloudflare)
  const cfIP = headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP.trim();
  }

  return 'unknown';
}

/**
 * Default key generator using IP address
 */
function defaultKeyGenerator(request: Request): string {
  return getClientIP(request);
}

/**
 * In-memory fallback rate limit check
 */
function checkRateLimitInMemory(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  cleanupOldEntries(windowMs);

  let entry = rateLimitStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(key, entry);
  }

  const windowStart = now - windowMs;
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  const reset = entry.timestamps.length > 0
    ? Math.ceil((entry.timestamps[0] + windowMs) / 1000)
    : Math.ceil((now + windowMs) / 1000);

  if (entry.timestamps.length >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset,
    };
  }

  entry.timestamps.push(now);

  return {
    success: true,
    limit,
    remaining: limit - entry.timestamps.length,
    reset,
  };
}

// Cache for Upstash rate limiters
const rateLimiterCache = new Map<string, Ratelimit>();

/**
 * Get or create an Upstash rate limiter
 */
function getUpstashRateLimiter(
  prefix: string,
  limit: number,
  windowMs: number
): Ratelimit | null {
  if (!redis) return null;

  const cacheKey = `${prefix}:${limit}:${windowMs}`;
  let limiter = rateLimiterCache.get(cacheKey);

  if (!limiter) {
    // Convert windowMs to seconds for Upstash
    const windowSeconds = Math.ceil(windowMs / 1000);

    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: `ratelimit:${prefix}`,
      analytics: true,
    });

    rateLimiterCache.set(cacheKey, limiter);
  }

  return limiter;
}

/**
 * Check rate limit for a request
 *
 * @param request - The incoming request
 * @param config - Rate limit configuration
 * @returns RateLimitResult with success status and headers info
 */
export async function checkRateLimit(
  request: Request,
  config: RateLimitConfig = {}
): Promise<RateLimitResult> {
  const {
    limit = 10,
    windowMs = 10 * 1000,
    keyGenerator = defaultKeyGenerator,
    prefix = 'api',
  } = config;

  const key = keyGenerator(request);

  // Try Upstash first
  const upstashLimiter = getUpstashRateLimiter(prefix, limit, windowMs);

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
      // Log error and fall back to in-memory
      console.error('[Rate Limit] Upstash error, using fallback:', error);
    }
  }

  // Fallback to in-memory
  return checkRateLimitInMemory(key, limit, windowMs);
}

/**
 * Synchronous check for backwards compatibility
 * Note: Prefer the async version for Upstash support
 */
export function checkRateLimitSync(
  request: Request,
  config: RateLimitConfig = {}
): RateLimitResult {
  const {
    limit = 10,
    windowMs = 10 * 1000,
    keyGenerator = defaultKeyGenerator,
  } = config;

  const key = keyGenerator(request);
  return checkRateLimitInMemory(key, limit, windowMs);
}

/**
 * Create rate limit headers for the response
 */
export function createRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
    ...(result.success ? {} : { 'Retry-After': Math.max(1, result.reset - Math.floor(Date.now() / 1000)).toString() }),
  };
}

/**
 * Rate limit middleware that returns a 429 response if limit exceeded
 */
export async function rateLimit(
  request: Request,
  config: RateLimitConfig = {}
): Promise<Response | null> {
  const result = await checkRateLimit(request, config);

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter: result.reset - Math.floor(Date.now() / 1000),
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

  return null;
}

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  config: RateLimitConfig = {}
) {
  return async (request: Request): Promise<Response> => {
    const rateLimitResponse = await rateLimit(request, config);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    return handler(request);
  };
}

/**
 * Create a custom rate limiter with different limits for different endpoints
 */
export function createRateLimiter(defaultConfig: RateLimitConfig = {}) {
  return {
    check: (request: Request, overrideConfig?: RateLimitConfig) =>
      checkRateLimit(request, { ...defaultConfig, ...overrideConfig }),

    checkSync: (request: Request, overrideConfig?: RateLimitConfig) =>
      checkRateLimitSync(request, { ...defaultConfig, ...overrideConfig }),

    limit: (request: Request, overrideConfig?: RateLimitConfig) =>
      rateLimit(request, { ...defaultConfig, ...overrideConfig }),

    wrap: (
      handler: (request: Request) => Promise<Response>,
      overrideConfig?: RateLimitConfig
    ) => withRateLimit(handler, { ...defaultConfig, ...overrideConfig }),
  };
}

// Pre-configured rate limiters for common use cases
export const authRateLimiter = createRateLimiter({
  limit: 10,
  windowMs: 10 * 1000, // 10 requests per 10 seconds
  prefix: 'auth',
});

export const strictRateLimiter = createRateLimiter({
  limit: 5,
  windowMs: 60 * 1000, // 5 requests per minute (for very sensitive ops)
  prefix: 'strict',
});

export const apiRateLimiter = createRateLimiter({
  limit: 100,
  windowMs: 60 * 1000, // 100 requests per minute (general API)
  prefix: 'general',
});
