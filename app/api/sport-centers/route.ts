import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/sport-centers - Get all sport centers
export async function GET() {
  try {
    const sportCenters = await prisma.sportCenter.findMany({
      orderBy: {
        name_en: 'asc',
      },
    });

    return NextResponse.json(sportCenters);
  } catch (error) {
    console.error('Error fetching sport centers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sport centers' },
      { status: 500 }
    );
  }
}
