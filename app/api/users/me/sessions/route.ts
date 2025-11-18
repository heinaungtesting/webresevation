import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

// GET /api/users/me/sessions - Get current user's sessions (attended)
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all sessions the user is attending
    const userSessions = await prisma.userSession.findMany({
      where: {
        user_id: user.id,
      },
      include: {
        session: {
          include: {
            sport_center: true,
            _count: {
              select: { user_sessions: true },
            },
          },
        },
      },
      orderBy: {
        session: {
          date_time: 'asc',
        },
      },
    });

    // Format response
    const sessions = userSessions.map((us: any) => ({
      attendance_id: us.id,
      marked_at: us.marked_at,
      session: {
        ...us.session,
        current_participants: us.session._count.user_sessions,
        _count: undefined,
      },
    }));

    // Separate into upcoming and past
    const now = new Date();
    const upcoming = sessions.filter(
      (s: any) => new Date(s.session.date_time) >= now
    );
    const past = sessions.filter((s: any) => new Date(s.session.date_time) < now);

    return NextResponse.json({
      upcoming,
      past,
      total: sessions.length,
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
