import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/users/me/favorites - Get user's favorited sessions
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { user_id: user.id },
      include: {
        session: {
          include: {
            sport_center: true,
            _count: {
              select: { user_sessions: true },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Format response
    const formattedFavorites = favorites.map((fav: any) => ({
      id: fav.id,
      created_at: fav.created_at,
      session: {
        ...fav.session,
        current_participants: fav.session._count.user_sessions,
        _count: undefined,
      },
    }));

    return NextResponse.json(formattedFavorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}
