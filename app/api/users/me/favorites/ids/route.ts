import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/me/favorites/ids - Get just the session IDs that user has favorited (lightweight)
 * This endpoint is optimized for batching favorite checks to prevent N+1 queries
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ sessionIds: [] });
    }

    // Only select session_id to minimize data transfer
    const favorites = await prisma.favorite.findMany({
      where: { user_id: user.id },
      select: { session_id: true },
    });

    return NextResponse.json({
      sessionIds: favorites.map((f: { session_id: string }) => f.session_id)
    });
  } catch (error) {
    console.error('Error fetching favorite IDs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorite IDs' },
      { status: 500 }
    );
  }
}
