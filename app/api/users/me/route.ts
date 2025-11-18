import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/users/me - Get current user profile
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
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
