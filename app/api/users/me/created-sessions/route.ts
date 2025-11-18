import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/me/created-sessions - Get sessions created by current user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all sessions created by this user
    const sessions = await prisma.session.findMany({
      where: {
        created_by: user.id,
      },
      include: {
        sport_center: true,
        user_sessions: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                display_name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date_time: 'asc',
      },
    });

    // Add current_participants count and format response
    const formattedSessions = sessions.map((session: any) => ({
      ...session,
      current_participants: session.user_sessions.length,
      participants: session.user_sessions.map((us: any) => us.user),
    }));

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching created sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch created sessions' },
      { status: 500 }
    );
  }
}
