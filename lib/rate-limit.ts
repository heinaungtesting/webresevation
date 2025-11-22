/**
 * Rate Limiting Utility
 *
 * Implements a sliding window rate limiter using an in-memory store.
 * For production at scale, consider using Redis/Upstash for distributed rate limiting.
 *
 * Default: 10 requests per 10 seconds per IP
 */

interface RateLimitEntry {
  timestamps: number[];
}

// In-memory store for rate limiting
// Note: This resets on server restart. For production, use Redis/Upstash
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically to prevent memory leaks
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
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
    // Get the first IP in the chain (client IP)
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

  // Fallback to a generic identifier
  return 'unknown';
}

/**
 * Default key generator using IP address
 */
function defaultKeyGenerator(request: Request): string {
  return `rate-limit:${getClientIP(request)}`;
}

/**
 * Check rate limit for a request
 *
 * @param request - The incoming request
 * @param config - Rate limit configuration
 * @returns RateLimitResult with success status and headers info
 *
 * @example
 * ```typescript
 * const result = checkRateLimit(request, { limit: 5, windowMs: 60000 });
 * if (!result.success) {
 *   return new Response('Too Many Requests', { status: 429 });
 * }
 * ```
 */
export function checkRateLimit(
  request: Request,
  config: RateLimitConfig = {}
): RateLimitResult {
  const {
    limit = 10,
    windowMs = 10 * 1000, // 10 seconds default
    keyGenerator = defaultKeyGenerator,
  } = config;

  const now = Date.now();
  const key = keyGenerator(request);

  // Cleanup old entries periodically
  cleanupOldEntries(windowMs);

  // Get or create entry for this key
  let entry = rateLimitStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(key, entry);
  }

  // Remove timestamps outside the current window
  const windowStart = now - windowMs;
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  // Calculate reset time (when the oldest request in window expires)
  const reset = entry.timestamps.length > 0
    ? Math.ceil((entry.timestamps[0] + windowMs) / 1000)
    : Math.ceil((now + windowMs) / 1000);

  // Check if limit exceeded
  if (entry.timestamps.length >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset,
    };
  }

  // Add current request timestamp
  entry.timestamps.push(now);

  return {
    success: true,
    limit,
    remaining: limit - entry.timestamps.length,
    reset,
  };
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
 *
 * @param request - The incoming request
 * @param config - Rate limit configuration
 * @returns null if allowed, Response if rate limited
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   const rateLimitResponse = rateLimit(request, { limit: 5, windowMs: 60000 });
 *   if (rateLimitResponse) {
 *     return rateLimitResponse;
 *   }
 *   // ... rest of handler
 * }
 * ```
 */
export function rateLimit(
  request: Request,
  config: RateLimitConfig = {}
): Response | null {
  const result = checkRateLimit(request, config);

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
 *
 * @param handler - The API route handler
 * @param config - Rate limit configuration
 * @returns Wrapped handler with rate limiting
 *
 * @example
 * ```typescript
 * export const POST = withRateLimit(
 *   async (request: Request) => {
 *     // ... handler logic
 *   },
 *   { limit: 5, windowMs: 60000 }
 * );
 * ```
 */
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  config: RateLimitConfig = {}
) {
  return async (request: Request): Promise<Response> => {
    const rateLimitResponse = rateLimit(request, config);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    return handler(request);
  };
}

/**
 * Create a custom rate limiter with different limits for different endpoints
 * Useful for applying stricter limits to sensitive routes
 */
export function createRateLimiter(defaultConfig: RateLimitConfig = {}) {
  return {
    check: (request: Request, overrideConfig?: RateLimitConfig) =>
      checkRateLimit(request, { ...defaultConfig, ...overrideConfig }),

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
});

export const strictRateLimiter = createRateLimiter({
  limit: 5,
  windowMs: 60 * 1000, // 5 requests per minute (for very sensitive ops)
});

export const apiRateLimiter = createRateLimiter({
  limit: 100,
  windowMs: 60 * 1000, // 100 requests per minute (general API)
});

// Test helper - only use in tests
export function __clearRateLimitStore() {
  if (process.env.NODE_ENV === 'test') {
    rateLimitStore.clear();
    lastCleanup = Date.now();
  }
}
