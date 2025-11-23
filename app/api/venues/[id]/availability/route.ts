// Venue Availability API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  generateTimeSlots,
  getOperatingHoursForDay,
  getDayOfWeek,
} from '@/lib/venue-booking';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: venueId } = await params;
    const { searchParams } = new URL(request.url);

    // Get date parameter (required)
    const dateStr = searchParams.get('date');
    if (!dateStr) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Parse and validate date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Check if date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return NextResponse.json(
        { error: 'Cannot check availability for past dates' },
        { status: 400 }
      );
    }

    // Optional sport type filter
    const sportType = searchParams.get('sport_type');

    // Fetch venue with courts and operating hours
    const venue = await prisma.sportCenter.findUnique({
      where: { id: venueId },
      include: {
        courts: {
          where: {
            is_active: true,
            ...(sportType ? { sport_type: sportType } : {}),
          },
          orderBy: { name_en: 'asc' },
        },
        operating_hours: true,
        closures: {
          where: {
            date: date,
          },
        },
      },
    });

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    if (!venue.is_bookable) {
      return NextResponse.json(
        { error: 'This venue does not support online booking' },
        { status: 400 }
      );
    }

    // Check if venue is closed on this day
    const closure = venue.closures[0];
    if (closure && closure.is_full_day) {
      return NextResponse.json({
        venue_id: venueId,
        date: dateStr,
        is_open: false,
        closure_reason: closure.reason_en || 'Venue closed',
        courts: [],
      });
    }

    // Get operating hours for this day
    const operatingHours = getOperatingHoursForDay(venue.operating_hours, date);
    if (!operatingHours) {
      return NextResponse.json({
        venue_id: venueId,
        date: dateStr,
        is_open: false,
        closure_reason: 'Venue closed on this day',
        courts: [],
      });
    }

    // Fetch existing bookings for all courts on this date
    const existingBookings = await prisma.courtBooking.findMany({
      where: {
        court: {
          sport_center_id: venueId,
        },
        booking_date: date,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      select: {
        court_id: true,
        start_time: true,
        end_time: true,
      },
    });

    // Group bookings by court
    const bookingsByCourtId = existingBookings.reduce((acc, booking) => {
      if (!acc[booking.court_id]) {
        acc[booking.court_id] = [];
      }
      acc[booking.court_id].push({
        start_time: booking.start_time,
        end_time: booking.end_time,
      });
      return acc;
    }, {} as Record<string, Array<{ start_time: string; end_time: string }>>);

    // Adjust operating hours if partial closure
    let openTime = operatingHours.open_time;
    let closeTime = operatingHours.close_time;
    if (closure && !closure.is_full_day) {
      if (closure.start_time && closure.end_time) {
        // For simplicity, if there's a partial closure, skip those hours
        // A more complex implementation would split the available times
      }
    }

    // Generate availability for each court
    const courtsAvailability = venue.courts.map(court => {
      const courtBookings = bookingsByCourtId[court.id] || [];
      const slots = generateTimeSlots(
        court.id,
        court.price_per_hour,
        openTime,
        closeTime,
        courtBookings,
        60 // 1-hour slots
      );

      return {
        court: {
          id: court.id,
          name_en: court.name_en,
          name_ja: court.name_ja,
          sport_type: court.sport_type,
          price_per_hour: court.price_per_hour,
          price_per_30min: court.price_per_30min,
          max_players: court.max_players,
          indoor: court.indoor,
          has_lighting: court.has_lighting,
          has_equipment: court.has_equipment,
        },
        slots,
        available_slots_count: slots.filter(s => s.is_available).length,
      };
    });

    return NextResponse.json({
      venue_id: venueId,
      date: dateStr,
      day_of_week: getDayOfWeek(date),
      is_open: true,
      operating_hours: {
        open: openTime,
        close: closeTime,
      },
      courts: courtsAvailability,
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}
