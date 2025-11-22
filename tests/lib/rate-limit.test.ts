import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  checkRateLimit,
  rateLimit,
  createRateLimitHeaders,
  createRateLimiter,
  withRateLimit,
  authRateLimiter,
  strictRateLimiter,
  apiRateLimiter,
  __clearRateLimitStore
} from '@/lib/rate-limit';

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Use fake timers for predictable time-based tests
    vi.useFakeTimers();
    // Clear rate limit store for isolated tests
    __clearRateLimitStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const mockRequest = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const result = checkRateLimit(mockRequest, { limit: 5, windowMs: 1000 });

      expect(result.success).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(4);
      expect(typeof result.reset).toBe('number');
    });

    it('should block requests exceeding limit', () => {
      const mockRequest = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.2' },
      });

      // Make requests up to the limit
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(mockRequest, { limit: 5, windowMs: 60000 });
        expect(result.success).toBe(true);
      }

      // Next request should fail
      const result = checkRateLimit(mockRequest, { limit: 5, windowMs: 60000 });

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.limit).toBe(5);
    });

    it('should reset after window expires', () => {
      const mockRequest = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.3' },
      });

      // Exhaust rate limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(mockRequest, { limit: 5, windowMs: 1000 });
      }

      // Verify limit is reached
      const limitedResult = checkRateLimit(mockRequest, { limit: 5, windowMs: 1000 });
      expect(limitedResult.success).toBe(false);

      // Advance time past window
      vi.advanceTimersByTime(1500);

      // Should be allowed again
      const result = checkRateLimit(mockRequest, { limit: 5, windowMs: 1000 });
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should handle different IPs independently', () => {
      const request1 = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const request2 = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.2' },
      });

      // Exhaust limit for IP 1
      for (let i = 0; i < 3; i++) {
        checkRateLimit(request1, { limit: 3, windowMs: 60000 });
      }
      const result1 = checkRateLimit(request1, { limit: 3, windowMs: 60000 });
      expect(result1.success).toBe(false);

      // IP 2 should still be allowed
      const result2 = checkRateLimit(request2, { limit: 3, windowMs: 60000 });
      expect(result2.success).toBe(true);
    });

    it('should use custom key generator', () => {
      const mockRequest = new Request('http://localhost/api/test');

      const customKeyGen = (request: Request) => 'custom-key';

      // First request should succeed
      const result1 = checkRateLimit(mockRequest, {
        limit: 2,
        windowMs: 60000,
        keyGenerator: customKeyGen
      });
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(1);

      // Second request should succeed
      const result2 = checkRateLimit(mockRequest, {
        limit: 2,
        windowMs: 60000,
        keyGenerator: customKeyGen
      });
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(0);

      // Third request should fail
      const result3 = checkRateLimit(mockRequest, {
        limit: 2,
        windowMs: 60000,
        keyGenerator: customKeyGen
      });
      expect(result3.success).toBe(false);
    });

    it('should handle missing IP headers', () => {
      const mockRequest = new Request('http://localhost/api/test');

      const result = checkRateLimit(mockRequest, { limit: 5, windowMs: 1000 });
      expect(result.success).toBe(true);
    });

    it('should use default config when none provided', () => {
      const mockRequest = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const result = checkRateLimit(mockRequest);
      expect(result.success).toBe(true);
      expect(result.limit).toBe(10); // default limit
    });
  });

  describe('IP extraction', () => {
    it('should extract IP from X-Forwarded-For header', () => {
      const mockRequest = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178' },
      });

      const result1 = checkRateLimit(mockRequest, { limit: 1, windowMs: 60000 });
      expect(result1.success).toBe(true);

      const result2 = checkRateLimit(mockRequest, { limit: 1, windowMs: 60000 });
      expect(result2.success).toBe(false); // Same IP should be rate limited
    });

    it('should extract IP from X-Real-IP header', () => {
      const mockRequest = new Request('http://localhost/api/test', {
        headers: { 'x-real-ip': '203.0.113.195' },
      });

      const result1 = checkRateLimit(mockRequest, { limit: 1, windowMs: 60000 });
      expect(result1.success).toBe(true);

      const result2 = checkRateLimit(mockRequest, { limit: 1, windowMs: 60000 });
      expect(result2.success).toBe(false);
    });

    it('should extract IP from CF-Connecting-IP header (Cloudflare)', () => {
      const mockRequest = new Request('http://localhost/api/test', {
        headers: { 'cf-connecting-ip': '203.0.113.195' },
      });

      const result1 = checkRateLimit(mockRequest, { limit: 1, windowMs: 60000 });
      expect(result1.success).toBe(true);

      const result2 = checkRateLimit(mockRequest, { limit: 1, windowMs: 60000 });
      expect(result2.success).toBe(false);
    });

    it('should prioritize X-Forwarded-For over other headers', () => {
      const mockRequest = new Request('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '203.0.113.195',
          'x-real-ip': '203.0.113.196',
          'cf-connecting-ip': '203.0.113.197'
        },
      });

      // Should use the X-Forwarded-For IP (203.0.113.195)
      const result1 = checkRateLimit(mockRequest, { limit: 1, windowMs: 60000 });
      expect(result1.success).toBe(true);

      // Request with different X-Forwarded-For should be allowed
      const mockRequest2 = new Request('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '203.0.113.196',
          'x-real-ip': '203.0.113.195', // This would be limited if used
        },
      });
      const result2 = checkRateLimit(mockRequest2, { limit: 1, windowMs: 60000 });
      expect(result2.success).toBe(true);
    });
  });

  describe('rateLimit middleware', () => {
    it('should return null when within limit', () => {
      const mockRequest = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.4' },
      });

      const response = rateLimit(mockRequest, { limit: 10, windowMs: 1000 });
      expect(response).toBeNull();
    });

    it('should return 429 response when limit exceeded', () => {
      const mockRequest = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.5' },
      });

      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        rateLimit(mockRequest, { limit: 5, windowMs: 60000 });
      }

      const response = rateLimit(mockRequest, { limit: 5, windowMs: 60000 });

      expect(response).not.toBeNull();
      expect(response?.status).toBe(429);
      expect(response?.headers.get('Content-Type')).toBe('application/json');
      expect(response?.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(response?.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response?.headers.get('Retry-After')).toBeDefined();
    });

    it('should include proper error message in response body', async () => {
      const mockRequest = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.6' },
      });

      // Exhaust limit
      for (let i = 0; i < 3; i++) {
        rateLimit(mockRequest, { limit: 3, windowMs: 60000 });
      }

      const response = rateLimit(mockRequest, { limit: 3, windowMs: 60000 });

      expect(response).not.toBeNull();
      const body = await response?.json();

      expect(body).toMatchObject({
        error: 'Too Many Requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter: expect.any(Number)
      });
    });
  });

  describe('createRateLimitHeaders', () => {
    it('should create correct headers for successful requests', () => {
      const result = {
        success: true,
        limit: 100,
        remaining: 95,
        reset: Math.floor(Date.now() / 1000) + 60,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers['X-RateLimit-Limit']).toBe('100');
      expect(headers['X-RateLimit-Remaining']).toBe('95');
      expect(headers['X-RateLimit-Reset']).toBe(result.reset.toString());
      expect(headers['Retry-After']).toBeUndefined();
    });

    it('should include Retry-After when rate limited', () => {
      const futureReset = Math.floor(Date.now() / 1000) + 30;
      const result = {
        success: false,
        limit: 100,
        remaining: 0,
        reset: futureReset,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers['X-RateLimit-Limit']).toBe('100');
      expect(headers['X-RateLimit-Remaining']).toBe('0');
      expect(headers['Retry-After']).toBeDefined();
      expect(parseInt(headers['Retry-After'] as string)).toBeGreaterThan(0);
    });
  });

  describe('withRateLimit higher-order function', () => {
    it('should call handler when within limit', async () => {
      const mockHandler = vi.fn().mockResolvedValue(new Response('Success', { status: 200 }));
      const wrappedHandler = withRateLimit(mockHandler, { limit: 5, windowMs: 60000 });

      const mockRequest = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.7' },
      });

      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('Success');
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
    });

    it('should return 429 instead of calling handler when rate limited', async () => {
      const mockHandler = vi.fn().mockResolvedValue(new Response('Success', { status: 200 }));
      const wrappedHandler = withRateLimit(mockHandler, { limit: 2, windowMs: 60000 });

      const mockRequest = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.8' },
      });

      // Use up the limit
      await wrappedHandler(mockRequest);
      await wrappedHandler(mockRequest);

      // This should be rate limited
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(429);
      expect(mockHandler).toHaveBeenCalledTimes(2); // Should not be called for rate limited request
    });
  });

  describe('createRateLimiter', () => {
    it('should create a rate limiter with default config', () => {
      const limiter = createRateLimiter({ limit: 5, windowMs: 30000 });

      const mockRequest = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.9' },
      });

      const result = limiter.check(mockRequest);
      expect(result.success).toBe(true);
      expect(result.limit).toBe(5);
    });

    it('should allow overriding default config', () => {
      const limiter = createRateLimiter({ limit: 5, windowMs: 30000 });

      const mockRequest = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.10' },
      });

      const result = limiter.check(mockRequest, { limit: 10 });
      expect(result.success).toBe(true);
      expect(result.limit).toBe(10); // Overridden limit
    });

    it('should provide limit middleware', () => {
      const limiter = createRateLimiter({ limit: 2, windowMs: 60000 });

      const mockRequest = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.11' },
      });

      expect(limiter.limit(mockRequest)).toBeNull(); // First request
      expect(limiter.limit(mockRequest)).toBeNull(); // Second request

      const response = limiter.limit(mockRequest); // Third request should be limited
      expect(response?.status).toBe(429);
    });

    it('should provide wrap functionality', async () => {
      const limiter = createRateLimiter({ limit: 1, windowMs: 60000 });

      const mockHandler = vi.fn().mockResolvedValue(new Response('OK'));
      const wrappedHandler = limiter.wrap(mockHandler);

      const mockRequest = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.12' },
      });

      const response1 = await wrappedHandler(mockRequest);
      expect(response1.status).toBe(200);

      const response2 = await wrappedHandler(mockRequest);
      expect(response2.status).toBe(429);
    });
  });

  describe('Pre-configured rate limiters', () => {
    it('should have auth rate limiter with correct config', () => {
      const mockRequest = new Request('http://localhost/api/auth/login', {
        headers: { 'x-forwarded-for': '192.168.1.13' },
      });

      const result = authRateLimiter.check(mockRequest);
      expect(result.success).toBe(true);
      expect(result.limit).toBe(10);
    });

    it('should have strict rate limiter with correct config', () => {
      const mockRequest = new Request('http://localhost/api/sensitive', {
        headers: { 'x-forwarded-for': '192.168.1.14' },
      });

      const result = strictRateLimiter.check(mockRequest);
      expect(result.success).toBe(true);
      expect(result.limit).toBe(5);
    });

    it('should have API rate limiter with correct config', () => {
      const mockRequest = new Request('http://localhost/api/data', {
        headers: { 'x-forwarded-for': '192.168.1.15' },
      });

      const result = apiRateLimiter.check(mockRequest);
      expect(result.success).toBe(true);
      expect(result.limit).toBe(100);
    });
  });

  describe('Memory cleanup', () => {
    it('should clean up expired entries', () => {
      const mockRequest = new Request('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.16' },
      });

      // Make some requests
      checkRateLimit(mockRequest, { limit: 10, windowMs: 1000 });

      // Advance time past cleanup interval (60 seconds) + window
      vi.advanceTimersByTime(61 * 1000 + 1500);

      // Make another request - this should trigger cleanup
      const result = checkRateLimit(mockRequest, { limit: 10, windowMs: 1000 });
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9); // Should start fresh after cleanup
    });
  });
});