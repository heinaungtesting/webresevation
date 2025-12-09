import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email';
import { authRateLimiter, createRateLimitHeaders } from '@/lib/rate-limit';
import { signupSchema, validateRequestBody } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Apply rate limiting: 10 requests per 10 seconds per IP
  const rateLimitResult = authRateLimiter.check(request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Too many signup attempts. Please try again later.',
        retryAfter: rateLimitResult.reset - Math.floor(Date.now() / 1000),
      },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  }

  try {
    const body = await request.json();

    // Validate input with Zod
    const validation = validateRequestBody(signupSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const {
      email,
      password,
      language,
      native_language,
      target_language,
      language_level,
    } = validation.data;

    // Create Supabase client
    const supabase = await createClient();

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: {
          language_preference: language,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Create user in database
    if (data.user) {
      try {
        await prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email!,
            language_preference: language,
            email_verified: false,
            // Language exchange fields
            native_language: native_language || null,
            target_language: target_language || null,
            language_level: language_level || null,
          },
        });

        // Send welcome email (non-blocking)
        sendWelcomeEmail(
          data.user.email!,
          data.user.email!.split('@')[0] // Use email username as default name
        ).catch(() => {
          // Email failure is non-critical, don't block signup
        });
      } catch (dbError) {
        // CRITICAL: Clean up Supabase auth user to prevent ghost user state
        // This prevents users from existing in Supabase Auth but not in the database
        try {
          const adminClient = createAdminClient();
          await adminClient.auth.admin.deleteUser(data.user.id);
        } catch (cleanupError) {
          // Log for manual cleanup if automatic cleanup fails
        }

        return NextResponse.json(
          { error: 'Failed to create user account. Please try again.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        message: 'Signup successful! Please check your email to verify your account.',
        user: data.user,
      },
      {
        status: 201,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
