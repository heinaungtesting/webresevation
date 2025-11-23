import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Pagination defaults
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// GET /api/users/me/sessions - Get current user's sessions (attended) with pagination
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10)));
    const type = searchParams.get('type'); // 'upcoming', 'past', or null for all
    const skip = (page - 1) * limit;

    const now = new Date();

    // Build date filter based on type
    const sessionDateFilter = type === 'upcoming'
      ? { gte: now }
      : type === 'past'
        ? { lt: now }
        : undefined;

    const where: any = {
      user_id: user.id,
      ...(sessionDateFilter && { session: { date_time: sessionDateFilter } }),
    };

    // Execute count and data queries in parallel
    const [userSessions, totalCount] = await Promise.all([
      prisma.userSession.findMany({
        where,
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
            date_time: type === 'past' ? 'desc' : 'asc',
          },
        },
        skip,
        take: limit,
      }),
      prisma.userSession.count({ where }),
    ]);

    // Format response
    const sessions = userSessions.map((us: any) => ({
      attendance_id: us.id,
      marked_at: us.marked_at,
      status: us.status,
      session: {
        ...us.session,
        current_participants: us.session._count.user_sessions,
        _count: undefined,
      },
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      data: sessions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
