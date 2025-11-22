import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validation schema for profile updates
const UpdateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  display_name: z.string().max(100, 'Display name too long').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional().nullable(),
  location: z.string().max(100, 'Location too long').optional(),
  sport_preferences: z.array(z.string()).max(20, 'Too many sport preferences').optional(),
  skill_levels: z.record(z.string(), z.string()).optional(),
  notification_email: z.boolean().optional(),
  notification_push: z.boolean().optional(),
  language_preference: z.enum(['en', 'ja']).optional(),
}).strict();

// GET /api/users/me - Get current user profile
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

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
  } catch (error: unknown) {
    const err = error as { name?: string; code?: string };

    // Handle timeout errors
    if (err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out. Please check your connection and try again.' },
        { status: 504 }
      );
    }

    // Handle network errors
    if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
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
  const rateLimitResponse = await rateLimit(request, { limit: 10, windowMs: 60 * 1000 });
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

    // Validate input with Zod schema
    const validation = UpdateProfileSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.map((e) => e.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

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
    } = validation.data;

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
