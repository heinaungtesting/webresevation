import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats - Get admin dashboard statistics
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Require admin access
    await requireAdmin(user?.id);

    // Get statistics in parallel
    const [
      totalUsers,
      totalSessions,
      totalSportCenters,
      totalMessages,
      recentUsers,
      upcomingSessions,
      activeSessions,
      usersByMonth,
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.session.count(),
      prisma.sportCenter.count(),
      prisma.message.count(),

      // Recent users (last 30 days)
      prisma.user.count({
        where: {
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Upcoming sessions
      prisma.session.count({
        where: {
          date_time: {
            gte: new Date(),
          },
        },
      }),

      // Active sessions (happening now, within +/- 3 hours)
      prisma.session.count({
        where: {
          date_time: {
            gte: new Date(Date.now() - 3 * 60 * 60 * 1000),
            lte: new Date(Date.now() + 3 * 60 * 60 * 1000),
          },
        },
      }),

      // User growth by month (last 6 months)
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as count
        FROM "User"
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month
        ORDER BY month ASC
      `,
    ]);

    // Sport type breakdown
    const sessionsBySport = await prisma.session.groupBy({
      by: ['sport_type'],
      _count: {
        sport_type: true,
      },
      orderBy: {
        _count: {
          sport_type: 'desc',
        },
      },
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        totalSessions,
        totalSportCenters,
        totalMessages,
        recentUsers,
        upcomingSessions,
        activeSessions,
      },
      charts: {
        usersByMonth,
        sessionsBySport: sessionsBySport.map((item: any) => ({
          sport: item.sport_type,
          count: item._count.sport_type,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);

    if (error.message?.includes('Unauthorized') || error.message?.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch admin statistics' },
      { status: 500 }
    );
  }
}
