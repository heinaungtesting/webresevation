import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { locales, defaultLocale } from './i18n';
import {
  csrfMiddleware,
  generateCsrfToken,
  setCsrfCookie,
} from '@/lib/csrf';

// Create the next-intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export async function proxy(request: NextRequest) {
  // Run CSRF validation for API routes with protected methods
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const csrfError = csrfMiddleware(request);
    if (csrfError) {
      return csrfError;
    }

    // For API routes, just run auth middleware and return
    const authResponse = await updateSession(request);

    // Ensure CSRF token cookie is set
    const existingCsrfToken = request.cookies.get('csrf_token')?.value;
    if (!existingCsrfToken) {
      const newToken = generateCsrfToken();
      setCsrfCookie(authResponse, newToken);
    }

    return authResponse;
  }

  // First, check for auth session updates and redirects
  const authResponse = await updateSession(request);

  // If updateSession returns a redirect (e.g. to login), we must return it immediately
  if (authResponse.status === 307 || authResponse.status === 302) {
    // Ensure CSRF token is set on redirects too
    const existingCsrfToken = request.cookies.get('csrf_token')?.value;
    if (!existingCsrfToken) {
      const newToken = generateCsrfToken();
      setCsrfCookie(authResponse, newToken);
    }
    return authResponse;
  }

  // If no redirect, run the intl middleware
  const intlResponse = intlMiddleware(request);

  // Merge cookies from auth response (which might have refreshed the session)
  // into the intl response so they are persisted
  authResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  // Ensure CSRF token cookie is set
  const existingCsrfToken = request.cookies.get('csrf_token')?.value;
  if (!existingCsrfToken) {
    const newToken = generateCsrfToken();
    setCsrfCookie(intlResponse, newToken);
  }

  return intlResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Note: API routes ARE included for CSRF protection
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
