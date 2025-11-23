// Bookings API - Create and list bookings
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import {
  calculateBookingPrice,
  calculateDuration,
  validateBookingRequest,
  isSlotAvailable,
  DEFAULT_COMMISSION_RATE,
} from '@/lib/venue-booking';
import type { CreateBookingRequest } from '@/types/venue-booking';

export const dynamic = 'force-dynamic';

// GET - List user's bookings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build where clause
    const where: Record<string, unknown> = {
      user_id: user.id,
    };

    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.courtBooking.findMany({
        where,
        include: {
          court: {
            include: {
              sport_center: {
                select: {
                  id: true,
                  name_en: true,
                  name_ja: true,
                  address_en: true,
                  address_ja: true,
                },
              },
            },
          },
        },
        orderBy: { booking_date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.courtBooking.count({ where }),
    ]);

    const response = bookings.map(booking => ({
      id: booking.id,
      court_id: booking.court_id,
      booking_date: booking.booking_date.toISOString().split('T')[0],
      start_time: booking.start_time,
      end_time: booking.end_time,
      duration_minutes: booking.duration_minutes,
      total_amount: booking.total_amount,
      status: booking.status,
      payment_status: booking.payment_status,
      user_notes: booking.user_notes,
      created_at: booking.created_at.toISOString(),
      court: {
        id: booking.court.id,
        name_en: booking.court.name_en,
        name_ja: booking.court.name_ja,
        sport_type: booking.court.sport_type,
      },
      venue: {
        id: booking.court.sport_center.id,
        name_en: booking.court.sport_center.name_en,
        name_ja: booking.court.sport_center.name_ja,
        address_en: booking.court.sport_center.address_en,
        address_ja: booking.court.sport_center.address_ja,
      },
    }));

    return NextResponse.json({
      bookings: response,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// POST - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateBookingRequest = await request.json();

    // Validate required fields
    if (!body.court_id || !body.booking_date || !body.start_time || !body.end_time) {
      return NextResponse.json(
        { error: 'Missing required fields: court_id, booking_date, start_time, end_time' },
        { status: 400 }
      );
    }

    // Parse booking date
    const bookingDate = new Date(body.booking_date);
    if (isNaN(bookingDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid booking_date format' },
        { status: 400 }
      );
    }

    // Validate booking request
    const validation = validateBookingRequest(body, bookingDate);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Fetch court and venue details
    const court = await prisma.court.findUnique({
      where: { id: body.court_id },
      include: {
        sport_center: {
          include: {
            venue_partner: true,
            operating_hours: true,
          },
        },
      },
    });

    if (!court) {
      return NextResponse.json(
        { error: 'Court not found' },
        { status: 404 }
      );
    }

    if (!court.is_active) {
      return NextResponse.json(
        { error: 'This court is not available for booking' },
        { status: 400 }
      );
    }

    if (!court.sport_center.is_bookable) {
      return NextResponse.json(
        { error: 'This venue does not support online booking' },
        { status: 400 }
      );
    }

    // Check for existing bookings that would conflict
    const existingBookings = await prisma.courtBooking.findMany({
      where: {
        court_id: body.court_id,
        booking_date: bookingDate,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      select: {
        start_time: true,
        end_time: true,
      },
    });

    // Check if slot is available
    if (!isSlotAvailable(body.start_time, body.end_time, existingBookings)) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 409 }
      );
    }

    // Calculate pricing
    const durationMinutes = calculateDuration(body.start_time, body.end_time);
    const commissionRate = court.sport_center.venue_partner?.commission_rate || DEFAULT_COMMISSION_RATE;
    const pricing = calculateBookingPrice(
      court.price_per_hour,
      court.price_per_30min,
      durationMinutes,
      commissionRate
    );

    // Create booking and commission transaction in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Create the booking
      const newBooking = await tx.courtBooking.create({
        data: {
          court_id: body.court_id,
          user_id: user.id,
          session_id: body.session_id || null,
          booking_date: bookingDate,
          start_time: body.start_time,
          end_time: body.end_time,
          duration_minutes: durationMinutes,
          subtotal: pricing.subtotal,
          commission: pricing.commission,
          total_amount: pricing.total_amount,
          venue_payout: pricing.venue_payout,
          status: 'PENDING',
          payment_status: 'PENDING',
          user_notes: body.user_notes,
        },
        include: {
          court: {
            include: {
              sport_center: {
                select: {
                  id: true,
                  name_en: true,
                  name_ja: true,
                  address_en: true,
                  address_ja: true,
                },
              },
            },
          },
        },
      });

      // Create commission transaction record
      await tx.commissionTransaction.create({
        data: {
          booking_id: newBooking.id,
          sport_center_id: court.sport_center.id,
          booking_amount: pricing.total_amount,
          commission_rate: commissionRate,
          commission_amount: pricing.commission,
          venue_amount: pricing.venue_payout,
          payout_status: 'PENDING',
        },
      });

      return newBooking;
    });

    return NextResponse.json({
      id: booking.id,
      court_id: booking.court_id,
      booking_date: booking.booking_date.toISOString().split('T')[0],
      start_time: booking.start_time,
      end_time: booking.end_time,
      duration_minutes: booking.duration_minutes,
      subtotal: booking.subtotal,
      commission: booking.commission,
      total_amount: booking.total_amount,
      status: booking.status,
      payment_status: booking.payment_status,
      created_at: booking.created_at.toISOString(),
      court: {
        id: booking.court.id,
        name_en: booking.court.name_en,
        name_ja: booking.court.name_ja,
        sport_type: booking.court.sport_type,
      },
      venue: {
        id: booking.court.sport_center.id,
        name_en: booking.court.sport_center.name_en,
        name_ja: booking.court.sport_center.name_ja,
        address_en: booking.court.sport_center.address_en,
        address_ja: booking.court.sport_center.address_ja,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
