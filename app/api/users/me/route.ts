import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { logger, createTimer } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/users/me - Get current user profile
export async function GET() {
  const timer = createTimer(logger, 'GET /api/users/me');
  
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      logger.error({ err: authError }, 'Authentication failed');
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    if (!user) {
      logger.debug('No user found in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.debug({ userId: user.id }, 'User authenticated');

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

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    timer.endWithWarning(500);
    return NextResponse.json(profile);
  } catch (error: any) {
    logger.error({ err: error }, 'Error fetching user profile');

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
