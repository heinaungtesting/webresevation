import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * CSRF Protection Utility
 *
 * Implements the Double Submit Cookie pattern:
 * 1. Server sets a CSRF token in a cookie
 * 2. Client sends the token back in a header (X-CSRF-Token)
 * 3. Server validates the header matches the cookie
 *
 * This prevents CSRF attacks because:
 * - Attackers can't read the cookie value (same-origin policy)
 * - Attackers can't set custom headers in cross-origin requests
 */

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generates a cryptographically secure random token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Gets the CSRF token from cookies, or generates a new one if not present
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!token) {
    token = generateCsrfToken();
  }

  return token;
}

/**
 * Validates the CSRF token from the request header against the cookie
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  return timingSafeEqual(cookieToken, headerToken);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Sets CSRF cookie on the response
 */
export function setCsrfCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JavaScript for the header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}

/**
 * HTTP methods that require CSRF validation
 */
const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Routes that are exempt from CSRF validation
 * (e.g., public API endpoints, webhooks)
 */
const CSRF_EXEMPT_ROUTES = [
  '/api/auth/callback', // OAuth callback
  '/api/cron/', // Cron jobs (use secret header instead)
  '/api/webhooks/', // External webhooks
];

/**
 * Check if a route should be exempt from CSRF validation
 */
export function isCsrfExemptRoute(pathname: string): boolean {
  return CSRF_EXEMPT_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if a request method requires CSRF validation
 */
export function requiresCsrfValidation(method: string): boolean {
  return CSRF_PROTECTED_METHODS.includes(method.toUpperCase());
}

/**
 * CSRF Middleware handler
 * Returns null if validation passes, or an error response if it fails
 */
export function csrfMiddleware(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Skip validation for exempt routes
  if (isCsrfExemptRoute(pathname)) {
    return null;
  }

  // Skip validation for GET, HEAD, OPTIONS
  if (!requiresCsrfValidation(method)) {
    return null;
  }

  // Only validate API routes
  if (!pathname.startsWith('/api/')) {
    return null;
  }

  // Validate CSRF token
  if (!validateCsrfToken(request)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Export constants for use in frontend
 */
export const CSRF_CONSTANTS = {
  COOKIE_NAME: CSRF_COOKIE_NAME,
  HEADER_NAME: CSRF_HEADER_NAME,
  TOKEN_LENGTH: CSRF_TOKEN_LENGTH,
} as const;

export type CsrfConstants = typeof CSRF_CONSTANTS;
