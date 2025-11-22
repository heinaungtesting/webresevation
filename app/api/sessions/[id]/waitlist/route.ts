import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/sessions/[id]/waitlist - Join the waitlist
export async function POST(request: Request, context: RouteContext) {
  // Rate limit: 10 waitlist operations per minute
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

    const { id: sessionId } = await context.params;

    // Fetch session with current participant count
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        _count: {
          select: { user_sessions: true, waitlist: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if session is in the past
    if (new Date(session.date_time) < new Date()) {
      return NextResponse.json(
        { error: 'Cannot join waitlist for past sessions' },
        { status: 400 }
      );
    }

    // Check if user is already attending
    const existingAttendance = await prisma.userSession.findUnique({
      where: {
        user_id_session_id: {
          user_id: user.id,
          session_id: sessionId,
        },
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'You are already attending this session' },
        { status: 400 }
      );
    }

    // Check if user is already on waitlist
    const existingWaitlist = await prisma.waitlist.findUnique({
      where: {
        session_id_user_id: {
          session_id: sessionId,
          user_id: user.id,
        },
      },
    });

    if (existingWaitlist) {
      return NextResponse.json(
        { error: 'You are already on the waitlist' },
        { status: 400 }
      );
    }

    // Check if session is actually full (waitlist only makes sense for full sessions)
    const isFull = session.max_participants && session._count.user_sessions >= session.max_participants;

    if (!isFull) {
      return NextResponse.json(
        { error: 'Session is not full. Please join directly instead of waitlist.' },
        { status: 400 }
      );
    }

    // Get current waitlist position
    const currentPosition = session._count.waitlist + 1;

    // Add to waitlist
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        session_id: sessionId,
        user_id: user.id,
        position: currentPosition,
      },
      include: {
        session: {
          select: {
            sport_type: true,
            date_time: true,
          },
        },
      },
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        user_id: user.id,
        type: 'waitlist_joined',
        title: 'Added to Waitlist',
        message: `You're #${currentPosition} on the waitlist for ${session.sport_type}. We'll notify you if a spot opens up!`,
        link: `/sessions/${sessionId}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `You're #${currentPosition} on the waitlist`,
      position: currentPosition,
      waitlist: {
        id: waitlistEntry.id,
        position: currentPosition,
        created_at: waitlistEntry.created_at,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error joining waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    );
  }
}

// GET /api/sessions/[id]/waitlist - Get waitlist info for a session
export async function GET(request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { id: sessionId } = await context.params;

    // Fetch waitlist with user info
    const waitlist = await prisma.waitlist.findMany({
      where: { session_id: sessionId },
      orderBy: { created_at: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            display_name: true,
            username: true,
            avatar_url: true,
          },
        },
      },
    });

    // Check if current user is on waitlist
    let userPosition: number | null = null;
    if (user) {
      const userEntry = waitlist.findIndex((w: typeof waitlist[number]) => w.user_id === user.id);
      if (userEntry !== -1) {
        userPosition = userEntry + 1;
      }
    }

    return NextResponse.json({
      count: waitlist.length,
      userPosition,
      waitlist: waitlist.map((w: typeof waitlist[number], index: number) => ({
        position: index + 1,
        user: w.user,
        joined_at: w.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waitlist' },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id]/waitlist - Leave the waitlist
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: sessionId } = await context.params;

    // Check if user is on waitlist
    const waitlistEntry = await prisma.waitlist.findUnique({
      where: {
        session_id_user_id: {
          session_id: sessionId,
          user_id: user.id,
        },
      },
    });

    if (!waitlistEntry) {
      return NextResponse.json(
        { error: 'You are not on the waitlist' },
        { status: 404 }
      );
    }

    // Remove from waitlist
    await prisma.waitlist.delete({
      where: { id: waitlistEntry.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Removed from waitlist',
    });
  } catch (error) {
    console.error('Error leaving waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to leave waitlist' },
      { status: 500 }
    );
  }
}
