import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { locales, defaultLocale } from './i18n';

// Create the next-intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export async function proxy(request: NextRequest) {
  // First, check for auth session updates and redirects
  const authResponse = await updateSession(request);

  // If updateSession returns a redirect (e.g. to login), we must return it immediately
  if (authResponse.status === 307 || authResponse.status === 302) {
    return authResponse;
  }

  // If no redirect, run the intl middleware
  const intlResponse = intlMiddleware(request);

  // Merge cookies from auth response (which might have refreshed the session)
  // into the intl response so they are persisted
  authResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return intlResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
