import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { authRateLimiter, createRateLimitHeaders } from '@/lib/rate-limit';
import { mapSupabaseAuthError } from '@/lib/auth-errors';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Apply rate limiting: 10 requests per 10 seconds per IP
  const rateLimitResult = authRateLimiter.check(request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Too many login attempts. Please try again later.',
        retryAfter: rateLimitResult.reset - Math.floor(Date.now() / 1000),
      },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  }

  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // BUG-008 fix: map Supabase login errors to distinct, user-friendly
    // HTTP statuses (was: 401 + raw error.message for every error, masking
    // "email not confirmed" so users couldn't self-recover).
    if (error) {
      const mapping = mapSupabaseAuthError(error, 'login');
      Sentry.captureException(error);
      return NextResponse.json(
        { error: mapping.error, code: mapping.code },
        { status: mapping.status, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    return NextResponse.json(
      {
        message: 'Login successful!',
        user: data.user,
      },
      {
        status: 200,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
