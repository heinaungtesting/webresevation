import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/users/me/stats - Get current user statistics
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session statistics
    const [totalSessions, upcomingSessions, pastSessions, createdSessions] = await Promise.all([
      prisma.userSession.count({
        where: { user_id: user.id },
      }),
      prisma.userSession.count({
        where: {
          user_id: user.id,
          session: {
            date_time: {
              gte: new Date(),
            },
          },
        },
      }),
      prisma.userSession.count({
        where: {
          user_id: user.id,
          session: {
            date_time: {
              lt: new Date(),
            },
          },
        },
      }),
      prisma.session.count({
        where: { created_by: user.id },
      }),
    ]);

    // Get sport breakdown
    const sportSessions = await prisma.userSession.groupBy({
      by: ['session_id'],
      where: {
        user_id: user.id,
      },
    });

    const sessionIds = sportSessions.map((s: any) => s.session_id);
    const sessions = await prisma.session.findMany({
      where: {
        id: {
          in: sessionIds,
        },
      },
      select: {
        sport_type: true,
      },
    });

    const sportBreakdown = sessions.reduce((acc: any, session: any) => {
      acc[session.sport_type] = (acc[session.sport_type] || 0) + 1;
      return acc;
    }, {});

    const stats = {
      total_sessions: totalSessions,
      upcoming_sessions: upcomingSessions,
      past_sessions: pastSessions,
      created_sessions: createdSessions,
      sport_breakdown: sportBreakdown,
      member_since: (await prisma.user.findUnique({
        where: { id: user.id },
        select: { created_at: true },
      }))?.created_at,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
