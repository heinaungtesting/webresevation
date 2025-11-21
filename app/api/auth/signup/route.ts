import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email';
import { authRateLimiter, createRateLimitHeaders } from '@/lib/rate-limit';

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
    const {
      email,
      password,
      language = 'en',
      // Language exchange fields (optional)
      native_language,
      target_language,
      language_level,
    } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate language_level if provided
    const validLanguageLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'NATIVE'];
    if (language_level && !validLanguageLevels.includes(language_level)) {
      return NextResponse.json(
        { error: 'Invalid language level. Must be one of: BEGINNER, INTERMEDIATE, ADVANCED, NATIVE' },
        { status: 400 }
      );
    }

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
        ).catch((err) => {
          console.error('Failed to send welcome email:', err);
          // Don't fail signup if email fails
        });
      } catch (dbError) {
        console.error('Database error:', dbError);

        // CRITICAL: Clean up Supabase auth user to prevent ghost user state
        // This prevents users from existing in Supabase Auth but not in the database
        try {
          const adminClient = createAdminClient();
          await adminClient.auth.admin.deleteUser(data.user.id);
          console.log(`Cleaned up Supabase auth user ${data.user.id} after database error`);
        } catch (cleanupError) {
          console.error('Failed to cleanup Supabase auth user:', cleanupError);
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
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
