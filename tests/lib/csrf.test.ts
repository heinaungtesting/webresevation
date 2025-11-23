import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateCsrfToken,
  validateCsrfToken,
  csrfMiddleware,
  isCsrfExemptRoute,
  requiresCsrfValidation,
  CSRF_CONSTANTS,
} from '@/lib/csrf';
import { NextRequest } from 'next/server';

// Helper to create NextRequest with cookies and headers
function createNextRequest(
  url: string,
  method: string,
  options: {
    csrfCookie?: string;
    csrfHeader?: string;
    otherCookies?: Record<string, string>;
  } = {}
): NextRequest {
  const headers = new Headers();

  // Build cookie string
  const cookies: string[] = [];
  if (options.csrfCookie) {
    cookies.push(`${CSRF_CONSTANTS.COOKIE_NAME}=${options.csrfCookie}`);
  }
  if (options.otherCookies) {
    Object.entries(options.otherCookies).forEach(([name, value]) => {
      cookies.push(`${name}=${value}`);
    });
  }
  if (cookies.length > 0) {
    headers.set('Cookie', cookies.join('; '));
  }

  // Set CSRF header
  if (options.csrfHeader) {
    headers.set(CSRF_CONSTANTS.HEADER_NAME, options.csrfHeader);
  }

  return new NextRequest(url, { method, headers });
}

describe('CSRF Protection Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateCsrfToken', () => {
    it('should generate a 64-character hex token', () => {
      const token = generateCsrfToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[a-f0-9]+$/);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set(Array.from({ length: 100 }, () => generateCsrfToken()));
      expect(tokens.size).toBe(100);
    });
  });

  describe('validateCsrfToken', () => {
    it('should return true for matching tokens', () => {
      const token = generateCsrfToken();
      const request = createNextRequest('http://localhost/api/data', 'POST', {
        csrfCookie: token,
        csrfHeader: token,
      });

      expect(validateCsrfToken(request)).toBe(true);
    });

    it('should return false for mismatched tokens', () => {
      const request = createNextRequest('http://localhost/api/data', 'POST', {
        csrfCookie: 'cookie-token',
        csrfHeader: 'different-header-token',
      });

      expect(validateCsrfToken(request)).toBe(false);
    });

    it('should return false when cookie is missing', () => {
      const request = createNextRequest('http://localhost/api/data', 'POST', {
        csrfHeader: 'header-token',
      });

      expect(validateCsrfToken(request)).toBe(false);
    });

    it('should return false when header is missing', () => {
      const request = createNextRequest('http://localhost/api/data', 'POST', {
        csrfCookie: 'cookie-token',
      });

      expect(validateCsrfToken(request)).toBe(false);
    });

    it('should return false for empty tokens', () => {
      const request = createNextRequest('http://localhost/api/data', 'POST', {
        csrfCookie: '',
        csrfHeader: '',
      });

      expect(validateCsrfToken(request)).toBe(false);
    });

    it('should be case-sensitive', () => {
      const request = createNextRequest('http://localhost/api/data', 'POST', {
        csrfCookie: 'abcd1234',
        csrfHeader: 'ABCD1234',
      });

      expect(validateCsrfToken(request)).toBe(false);
    });
  });

  describe('csrfMiddleware', () => {
    it('should skip validation for GET requests', () => {
      const request = createNextRequest('http://localhost/api/data', 'GET');

      const result = csrfMiddleware(request);
      expect(result).toBeNull();
    });

    it('should skip validation for HEAD requests', () => {
      const request = createNextRequest('http://localhost/api/data', 'HEAD');

      const result = csrfMiddleware(request);
      expect(result).toBeNull();
    });

    it('should skip validation for OPTIONS requests', () => {
      const request = createNextRequest('http://localhost/api/data', 'OPTIONS');

      const result = csrfMiddleware(request);
      expect(result).toBeNull();
    });

    it('should return 403 when CSRF token is missing', () => {
      const request = createNextRequest('http://localhost/api/data', 'POST', {
        csrfCookie: 'cookie-token',
        // No header
      });

      const result = csrfMiddleware(request);

      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should return 403 when CSRF cookie is missing', () => {
      const request = createNextRequest('http://localhost/api/data', 'POST', {
        csrfHeader: 'header-token',
        // No cookie
      });

      const result = csrfMiddleware(request);

      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should return 403 when tokens do not match', () => {
      const request = createNextRequest('http://localhost/api/data', 'POST', {
        csrfCookie: 'cookie-token',
        csrfHeader: 'different-header-token',
      });

      const result = csrfMiddleware(request);

      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('should return null (pass) when tokens match', () => {
      const token = generateCsrfToken();
      const request = createNextRequest('http://localhost/api/data', 'POST', {
        csrfCookie: token,
        csrfHeader: token,
      });

      const result = csrfMiddleware(request);
      expect(result).toBeNull();
    });

    it('should validate PUT requests', () => {
      const token = generateCsrfToken();
      const request = createNextRequest('http://localhost/api/data', 'PUT', {
        csrfCookie: token,
        csrfHeader: token,
      });

      const result = csrfMiddleware(request);
      expect(result).toBeNull();
    });

    it('should validate DELETE requests', () => {
      const token = generateCsrfToken();
      const request = createNextRequest('http://localhost/api/data', 'DELETE', {
        csrfCookie: token,
        csrfHeader: token,
      });

      const result = csrfMiddleware(request);
      expect(result).toBeNull();
    });

    it('should validate PATCH requests', () => {
      const token = generateCsrfToken();
      const request = createNextRequest('http://localhost/api/data', 'PATCH', {
        csrfCookie: token,
        csrfHeader: token,
      });

      const result = csrfMiddleware(request);
      expect(result).toBeNull();
    });

    it('should handle multiple cookies correctly', () => {
      const token = generateCsrfToken();
      const request = createNextRequest('http://localhost/api/data', 'POST', {
        csrfCookie: token,
        csrfHeader: token,
        otherCookies: {
          'other': 'value',
          'another': 'cookie',
        },
      });

      const result = csrfMiddleware(request);
      expect(result).toBeNull();
    });

    it('should skip validation for non-API routes', () => {
      const request = createNextRequest('http://localhost/about', 'POST');

      const result = csrfMiddleware(request);
      expect(result).toBeNull();
    });
  });

  describe('isCsrfExemptRoute', () => {
    it('should exempt OAuth callback routes', () => {
      expect(isCsrfExemptRoute('/api/auth/callback')).toBe(true);
      expect(isCsrfExemptRoute('/api/auth/callback/google')).toBe(true);
    });

    it('should exempt cron routes', () => {
      expect(isCsrfExemptRoute('/api/cron/cleanup')).toBe(true);
    });

    it('should exempt webhook routes', () => {
      expect(isCsrfExemptRoute('/api/webhooks/stripe')).toBe(true);
    });

    it('should not exempt regular API routes', () => {
      expect(isCsrfExemptRoute('/api/sessions')).toBe(false);
      expect(isCsrfExemptRoute('/api/users/me')).toBe(false);
    });
  });

  describe('requiresCsrfValidation', () => {
    it('should require validation for POST', () => {
      expect(requiresCsrfValidation('POST')).toBe(true);
    });

    it('should require validation for PUT', () => {
      expect(requiresCsrfValidation('PUT')).toBe(true);
    });

    it('should require validation for PATCH', () => {
      expect(requiresCsrfValidation('PATCH')).toBe(true);
    });

    it('should require validation for DELETE', () => {
      expect(requiresCsrfValidation('DELETE')).toBe(true);
    });

    it('should not require validation for GET', () => {
      expect(requiresCsrfValidation('GET')).toBe(false);
    });

    it('should not require validation for HEAD', () => {
      expect(requiresCsrfValidation('HEAD')).toBe(false);
    });

    it('should not require validation for OPTIONS', () => {
      expect(requiresCsrfValidation('OPTIONS')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(requiresCsrfValidation('post')).toBe(true);
      expect(requiresCsrfValidation('get')).toBe(false);
    });
  });

  describe('CSRF_CONSTANTS', () => {
    it('should export correct cookie name', () => {
      expect(CSRF_CONSTANTS.COOKIE_NAME).toBe('csrf_token');
    });

    it('should export correct header name', () => {
      expect(CSRF_CONSTANTS.HEADER_NAME).toBe('x-csrf-token');
    });

    it('should export correct token length', () => {
      expect(CSRF_CONSTANTS.TOKEN_LENGTH).toBe(32);
    });
  });
});
