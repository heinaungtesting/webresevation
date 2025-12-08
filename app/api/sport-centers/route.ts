import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sportCenterCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET /api/sport-centers - Get all sport centers (with caching)
export async function GET() {
  try {
    // Try to get from cache first
    const cacheKey = 'all-sport-centers';
    const cachedCenters = await sportCenterCache.get<any[]>(cacheKey);
    
    if (cachedCenters) {
      return NextResponse.json(cachedCenters);
    }

    // If not in cache, fetch from database
    const sportCenters = await prisma.sportCenter.findMany({
      orderBy: {
        name_en: 'asc',
      },
    });

    // Store in cache (non-blocking) - sport centers change rarely
    sportCenterCache.set(cacheKey, sportCenters).catch((err) => {
      console.error('Failed to cache sport centers:', err);
    });

    // Add cache headers - sport centers change rarely (1 hour cache)
    return NextResponse.json(sportCenters, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching sport centers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sport centers' },
      { status: 500 }
    );
  }
}
