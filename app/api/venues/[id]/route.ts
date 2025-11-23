// Venue Details API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const venue = await prisma.sportCenter.findUnique({
      where: { id },
      include: {
        courts: {
          where: { is_active: true },
          orderBy: { name_en: 'asc' },
        },
        amenities: true,
        operating_hours: {
          orderBy: { day_of_week: 'asc' },
        },
        closures: {
          where: {
            date: {
              gte: new Date(),
            },
          },
          orderBy: { date: 'asc' },
          take: 30, // Next 30 closures
        },
        venue_partner: {
          select: {
            status: true,
            commission_rate: true,
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

    // Transform response
    const response = {
      id: venue.id,
      name_en: venue.name_en,
      name_ja: venue.name_ja,
      address_en: venue.address_en,
      address_ja: venue.address_ja,
      station_en: venue.station_en,
      station_ja: venue.station_ja,
      latitude: venue.latitude,
      longitude: venue.longitude,
      image_url: venue.image_url,
      description_en: venue.description_en,
      description_ja: venue.description_ja,
      phone: venue.phone,
      email: venue.email,
      website: venue.website,
      is_bookable: venue.is_bookable,
      courts: venue.courts.map(court => ({
        id: court.id,
        name_en: court.name_en,
        name_ja: court.name_ja,
        sport_type: court.sport_type,
        description_en: court.description_en,
        description_ja: court.description_ja,
        price_per_hour: court.price_per_hour,
        price_per_30min: court.price_per_30min,
        max_players: court.max_players,
        min_players: court.min_players,
        indoor: court.indoor,
        has_lighting: court.has_lighting,
        has_equipment: court.has_equipment,
      })),
      amenities: venue.amenities.map(a => ({
        id: a.id,
        name_en: a.name_en,
        name_ja: a.name_ja,
        icon: a.icon,
        is_free: a.is_free,
        price: a.price,
      })),
      operating_hours: venue.operating_hours.map(h => ({
        day_of_week: h.day_of_week,
        open_time: h.open_time,
        close_time: h.close_time,
        is_closed: h.is_closed,
      })),
      upcoming_closures: venue.closures.map(c => ({
        date: c.date.toISOString().split('T')[0],
        reason_en: c.reason_en,
        reason_ja: c.reason_ja,
        is_full_day: c.is_full_day,
        start_time: c.start_time,
        end_time: c.end_time,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching venue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venue details' },
      { status: 500 }
    );
  }
}
