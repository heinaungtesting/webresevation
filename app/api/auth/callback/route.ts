import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUserExists } from '@/lib/ensure-user';

export const dynamic = 'force-dynamic';

/**
 * Validates and sanitizes the redirect path to prevent open redirect attacks.
 * Only allows relative paths that start with / and don't contain protocol schemes.
 */
function sanitizeRedirectPath(path: string | null): string {
  if (!path) return '/';

  // Remove any whitespace
  const trimmed = path.trim();

  // Must start with a single forward slash (not // which could be protocol-relative)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return '/';
  }

  // Block any protocol schemes (e.g., javascript:, data:, http:, https:)
  if (/^\/.*:/i.test(trimmed) || /[\\]/.test(trimmed)) {
    return '/';
  }

  // Block encoded characters that could bypass validation
  try {
    const decoded = decodeURIComponent(trimmed);
    if (decoded.startsWith('//') || /^\/.*:/i.test(decoded) || /[\\]/.test(decoded)) {
      return '/';
    }
  } catch {
    // If decoding fails, reject the path
    return '/';
  }

  return trimmed;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = sanitizeRedirectPath(searchParams.get('next'));
  const errorParam = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');

  // Parse locale from cookies or default to en
  let locale = 'en';
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/NEXT_LOCALE=([^;]+)/);
  if (match) {
    locale = match[1];
  }

  if (errorParam || errorDesc) {
    console.error('[/api/auth/callback] OAuth provider error:', errorParam, errorDesc);
    return NextResponse.redirect(`${origin}/${locale}/login?error=OAuthFailed`);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Ensure user exists in the Prisma database (especially for first-time OAuth signups)
      try {
        await ensureUserExists(data.user);
        
        // Update email_verified status in database
        await prisma.user.update({
          where: { id: data.user.id },
          data: { email_verified: true },
        });
      } catch (dbError) {
        console.error('Database sync/update error:', dbError);
      }

      const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } else if (error) {
      console.error('[/api/auth/callback] exchangeCodeForSession error:', error.message);
    }
  }

  // Redirect user to the login page with a clear code error parameter rather than a generic 404 page
  return NextResponse.redirect(`${origin}/${locale}/login?error=auth-code-error`);
}
