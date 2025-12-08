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

    // Get sport breakdown - optimized to avoid N+1 query pattern
    // Use a single query with join instead of separate groupBy and findMany
    const userSessionsWithSport = await prisma.userSession.findMany({
      where: {
        user_id: user.id,
      },
      select: {
        session: {
          select: {
            sport_type: true,
          },
        },
      },
    });

    const sportBreakdown = userSessionsWithSport.reduce((acc: any, us: any) => {
      const sportType = us.session.sport_type;
      acc[sportType] = (acc[sportType] || 0) + 1;
      return acc;
    }, {});

    // Get user reliability data
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        created_at: true,
        reliability_score: true,
        no_show_count: true,
      },
    });

    const stats = {
      total_sessions: totalSessions,
      upcoming_sessions: upcomingSessions,
      past_sessions: pastSessions,
      created_sessions: createdSessions,
      sport_breakdown: sportBreakdown,
      member_since: userData?.created_at,
      reliability_score: userData?.reliability_score ?? 100,
      no_show_count: userData?.no_show_count ?? 0,
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
