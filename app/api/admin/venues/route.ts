// Admin Venues API - List venues with booking stats
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { is_admin: true },
    });

    if (!dbUser?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const bookable_only = searchParams.get('bookable_only') === 'true';

    const where = bookable_only ? { is_bookable: true } : {};

    const [venues, total] = await Promise.all([
      prisma.sportCenter.findMany({
        where,
        include: {
          venue_partner: true,
          courts: {
            select: { id: true },
          },
          _count: {
            select: {
              courts: true,
            },
          },
        },
        orderBy: { name_en: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sportCenter.count({ where }),
    ]);

    // Get booking stats for each venue
    const venueIds = venues.map(v => v.id);
    const bookingStats = await prisma.courtBooking.groupBy({
      by: ['court_id'],
      where: {
        court: {
          sport_center_id: { in: venueIds },
        },
      },
      _count: true,
      _sum: {
        total_amount: true,
        commission: true,
      },
    });

    // Get court to venue mapping
    const courts = await prisma.court.findMany({
      where: { sport_center_id: { in: venueIds } },
      select: { id: true, sport_center_id: true },
    });

    const courtToVenue = new Map(courts.map(c => [c.id, c.sport_center_id]));

    // Aggregate stats by venue
    const venueStatsMap = new Map<string, { bookings: number; revenue: number; commission: number }>();
    for (const stat of bookingStats) {
      const venueId = courtToVenue.get(stat.court_id);
      if (venueId) {
        const existing = venueStatsMap.get(venueId) || { bookings: 0, revenue: 0, commission: 0 };
        venueStatsMap.set(venueId, {
          bookings: existing.bookings + stat._count,
          revenue: existing.revenue + (stat._sum.total_amount || 0),
          commission: existing.commission + (stat._sum.commission || 0),
        });
      }
    }

    const response = venues.map(venue => {
      const stats = venueStatsMap.get(venue.id) || { bookings: 0, revenue: 0, commission: 0 };
      return {
        id: venue.id,
        name_en: venue.name_en,
        name_ja: venue.name_ja,
        address_en: venue.address_en,
        is_bookable: venue.is_bookable,
        courts_count: venue._count.courts,
        partner_status: venue.venue_partner?.status || null,
        commission_rate: venue.venue_partner?.commission_rate || 0.10,
        stats: {
          total_bookings: stats.bookings,
          total_revenue: stats.revenue,
          total_commission: stats.commission,
        },
      };
    });

    return NextResponse.json({
      venues: response,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin venues:', error);
    return NextResponse.json({ error: 'Failed to fetch venues' }, { status: 500 });
  }
}
