import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// GET /api/users/me - Get current user profile
export async function GET() {
  try {
    const startTime = Date.now();
    console.log('[/api/users/me] Starting request...');

    const supabase = await createClient();
    console.log(`[/api/users/me] Supabase client created in ${Date.now() - startTime}ms`);

    const authStartTime = Date.now();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log(`[/api/users/me] Auth check completed in ${Date.now() - authStartTime}ms`);

    if (authError) {
      console.error('[/api/users/me] Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    if (!user) {
      console.log('[/api/users/me] No user found in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[/api/users/me] User authenticated: ${user.id}`);

    const dbStartTime = Date.now();
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        bio: true,
        avatar_url: true,
        location: true,
        sport_preferences: true,
        skill_levels: true,
        notification_email: true,
        notification_push: true,
        language_preference: true,
        email_verified: true,
        created_at: true,
        _count: {
          select: {
            created_sessions: true,
            user_sessions: true,
          },
        },
      },
    });
    console.log(`[/api/users/me] Database query completed in ${Date.now() - dbStartTime}ms`);

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`[/api/users/me] Total request time: ${Date.now() - startTime}ms`);
    return NextResponse.json(profile);
  } catch (error: any) {
    console.error('Error fetching user profile:', error);

    // Handle timeout errors
    if (error.name === 'AbortError') {
      console.error('[/api/users/me] Request timed out after 10 seconds');
      return NextResponse.json(
        { error: 'Request timed out. Please check your connection and try again.' },
        { status: 504 }
      );
    }

    // Handle network errors
    if (error.code === 'ECONNRESET' || error.code === 'EPIPE') {
      console.error(`[/api/users/me] Network error: ${error.code}`);
      return NextResponse.json(
        { error: 'Network connection error. Please try again.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/me - Update current user profile
export async function PATCH(request: Request) {
  // Rate limit: 10 profile updates per minute
  const rateLimitResponse = rateLimit(request, { limit: 10, windowMs: 60 * 1000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      username,
      display_name,
      bio,
      avatar_url,
      location,
      sport_preferences,
      skill_levels,
      notification_email,
      notification_push,
      language_preference,
    } = body;

    // Validate username uniqueness if provided
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: {
            id: user.id,
          },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 400 }
        );
      }
    }

    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(username !== undefined && { username }),
        ...(display_name !== undefined && { display_name }),
        ...(bio !== undefined && { bio }),
        ...(avatar_url !== undefined && { avatar_url }),
        ...(location !== undefined && { location }),
        ...(sport_preferences !== undefined && { sport_preferences }),
        ...(skill_levels !== undefined && { skill_levels }),
        ...(notification_email !== undefined && { notification_email }),
        ...(notification_push !== undefined && { notification_push }),
        ...(language_preference !== undefined && { language_preference }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        bio: true,
        avatar_url: true,
        location: true,
        sport_preferences: true,
        skill_levels: true,
        notification_email: true,
        notification_push: true,
        language_preference: true,
        email_verified: true,
        created_at: true,
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
