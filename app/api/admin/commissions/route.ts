// Admin Commissions API - Commission tracking and summary
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
    const period = searchParams.get('period') || 'month'; // day, week, month, year
    const venue_id = searchParams.get('venue_id');

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Build where clause
    const where: Record<string, unknown> = {
      created_at: { gte: startDate },
    };

    if (venue_id) {
      where.sport_center_id = venue_id;
    }

    // Get commission transactions
    const transactions = await prisma.commissionTransaction.findMany({
      where,
      include: {
        booking: {
          select: {
            id: true,
            booking_date: true,
            start_time: true,
            end_time: true,
            status: true,
            payment_status: true,
            user: {
              select: {
                display_name: true,
                email: true,
              },
            },
          },
        },
        sport_center: {
          select: {
            id: true,
            name_en: true,
            name_ja: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Calculate summary
    const summary = {
      total_bookings: transactions.length,
      total_revenue: 0,
      total_commission: 0,
      total_venue_payout: 0,
      pending_payout: 0,
      paid_payout: 0,
    };

    const byVenue: Record<string, {
      venue_id: string;
      venue_name: string;
      bookings: number;
      revenue: number;
      commission: number;
      payout: number;
      pending: number;
    }> = {};

    for (const tx of transactions) {
      summary.total_revenue += tx.booking_amount;
      summary.total_commission += tx.commission_amount;
      summary.total_venue_payout += tx.venue_amount;

      if (tx.payout_status === 'PENDING') {
        summary.pending_payout += tx.venue_amount;
      } else if (tx.payout_status === 'PAID') {
        summary.paid_payout += tx.venue_amount;
      }

      // Group by venue
      const venueId = tx.sport_center_id;
      if (!byVenue[venueId]) {
        byVenue[venueId] = {
          venue_id: venueId,
          venue_name: tx.sport_center.name_en,
          bookings: 0,
          revenue: 0,
          commission: 0,
          payout: 0,
          pending: 0,
        };
      }

      byVenue[venueId].bookings += 1;
      byVenue[venueId].revenue += tx.booking_amount;
      byVenue[venueId].commission += tx.commission_amount;
      byVenue[venueId].payout += tx.venue_amount;
      if (tx.payout_status === 'PENDING') {
        byVenue[venueId].pending += tx.venue_amount;
      }
    }

    return NextResponse.json({
      period: {
        name: period,
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
      summary,
      by_venue: Object.values(byVenue).sort((a, b) => b.revenue - a.revenue),
      transactions: transactions.slice(0, 50).map(tx => ({
        id: tx.id,
        booking_id: tx.booking_id,
        venue: {
          id: tx.sport_center.id,
          name: tx.sport_center.name_en,
        },
        booking_amount: tx.booking_amount,
        commission_rate: tx.commission_rate,
        commission_amount: tx.commission_amount,
        venue_amount: tx.venue_amount,
        payout_status: tx.payout_status,
        payout_date: tx.payout_date?.toISOString(),
        created_at: tx.created_at.toISOString(),
        booking: {
          date: tx.booking.booking_date.toISOString().split('T')[0],
          time: `${tx.booking.start_time} - ${tx.booking.end_time}`,
          status: tx.booking.status,
          user: tx.booking.user.display_name || tx.booking.user.email,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching commissions:', error);
    return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 });
  }
}
