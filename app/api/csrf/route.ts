import { NextResponse } from 'next/server';
import { getCsrfToken, setCsrfCookie, CSRF_CONSTANTS } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

/**
 * GET /api/csrf - Get a CSRF token
 *
 * This endpoint returns the current CSRF token and ensures
 * the cookie is set. Clients should call this on app initialization
 * and use the token in the X-CSRF-Token header for all mutations.
 */
export async function GET() {
  const token = await getCsrfToken();

  const response = NextResponse.json({
    csrfToken: token,
    headerName: CSRF_CONSTANTS.HEADER_NAME,
  });

  // Ensure the cookie is set
  setCsrfCookie(response, token);

  return response;
}
