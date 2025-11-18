import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/sport-centers - Get all sport centers (admin)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Require admin access
    await requireAdmin(user?.id);

    const sportCenters = await prisma.sportCenter.findMany({
      include: {
        _count: {
          select: {
            sessions: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(sportCenters);
  } catch (error: any) {
    console.error('Error fetching sport centers:', error);

    if (error.message?.includes('Unauthorized') || error.message?.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch sport centers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sport-centers - Create a new sport center (admin)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Require admin access
    await requireAdmin(user?.id);

    const body = await request.json();
    const {
      name_en,
      name_ja,
      address_en,
      address_ja,
      station_en,
      station_ja,
      latitude,
      longitude,
      image_url,
    } = body;

    // Validate required fields
    if (!name_en || !name_ja || !address_en || !address_ja) {
      return NextResponse.json(
        { error: 'Name and address (both EN and JA) are required' },
        { status: 400 }
      );
    }

    const sportCenter = await prisma.sportCenter.create({
      data: {
        name_en,
        name_ja,
        address_en,
        address_ja,
        station_en: station_en || null,
        station_ja: station_ja || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        image_url: image_url || null,
      },
    });

    return NextResponse.json(sportCenter, { status: 201 });
  } catch (error: any) {
    console.error('Error creating sport center:', error);

    if (error.message?.includes('Unauthorized') || error.message?.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to create sport center' },
      { status: 500 }
    );
  }
}
