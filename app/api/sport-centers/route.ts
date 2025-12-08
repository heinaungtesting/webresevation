import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

// Cache sport centers for 1 hour since they don't change frequently
const getCachedSportCenters = unstable_cache(
  async () => {
    return prisma.sportCenter.findMany({
      orderBy: {
        name_en: 'asc',
      },
    });
  },
  ['sport-centers'],
  { revalidate: 3600 } // 1 hour
);

// GET /api/sport-centers - Get all sport centers
export async function GET() {
  try {
    const sportCenters = await getCachedSportCenters();

    return NextResponse.json(sportCenters);
  } catch (error) {
    console.error('Error fetching sport centers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sport centers' },
      { status: 500 }
    );
  }
}
