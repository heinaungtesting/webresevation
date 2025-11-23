// Venues API - List bookable venues
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const sport_type = searchParams.get('sport_type');
    const indoor = searchParams.get('indoor');
    const has_equipment = searchParams.get('has_equipment');
    const min_price = searchParams.get('min_price');
    const max_price = searchParams.get('max_price');
    const near_station = searchParams.get('near_station');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const where: Record<string, unknown> = {
      is_bookable: true,
    };

    // Build court filters
    const courtWhere: Record<string, unknown> = {
      is_active: true,
    };

    if (sport_type) {
      courtWhere.sport_type = sport_type;
    }

    if (indoor !== null && indoor !== undefined) {
      courtWhere.indoor = indoor === 'true';
    }

    if (has_equipment !== null && has_equipment !== undefined) {
      courtWhere.has_equipment = has_equipment === 'true';
    }

    if (min_price) {
      courtWhere.price_per_hour = {
        ...((courtWhere.price_per_hour as object) || {}),
        gte: parseInt(min_price),
      };
    }

    if (max_price) {
      courtWhere.price_per_hour = {
        ...((courtWhere.price_per_hour as object) || {}),
        lte: parseInt(max_price),
      };
    }

    if (near_station) {
      where.OR = [
        { station_en: { contains: near_station, mode: 'insensitive' } },
        { station_ja: { contains: near_station } },
      ];
    }

    // Fetch venues with courts, amenities, and operating hours
    const [venues, total] = await Promise.all([
      prisma.sportCenter.findMany({
        where,
        include: {
          courts: {
            where: courtWhere,
            orderBy: { price_per_hour: 'asc' },
          },
          amenities: true,
          operating_hours: {
            orderBy: { day_of_week: 'asc' },
          },
          venue_partner: {
            select: {
              status: true,
            },
          },
        },
        orderBy: { name_en: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sportCenter.count({ where }),
    ]);

    // Filter venues that have matching courts (if sport_type filter is applied)
    const filteredVenues = sport_type
      ? venues.filter(v => v.courts.length > 0)
      : venues;

    // Transform response
    const response = filteredVenues.map(venue => ({
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
      website: venue.website,
      is_bookable: venue.is_bookable,
      courts_count: venue.courts.length,
      min_price: venue.courts.length > 0
        ? Math.min(...venue.courts.map(c => c.price_per_hour))
        : null,
      max_price: venue.courts.length > 0
        ? Math.max(...venue.courts.map(c => c.price_per_hour))
        : null,
      sport_types: [...new Set(venue.courts.map(c => c.sport_type))],
      amenities: venue.amenities.map(a => ({
        name_en: a.name_en,
        name_ja: a.name_ja,
        icon: a.icon,
        is_free: a.is_free,
      })),
      operating_hours: venue.operating_hours,
    }));

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
    console.error('Error fetching venues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venues' },
      { status: 500 }
    );
  }
}
