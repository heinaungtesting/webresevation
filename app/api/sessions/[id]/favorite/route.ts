import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

// POST /api/sessions/[id]/favorite - Add session to favorites
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: 30 favorite operations per minute
  const rateLimitResponse = await rateLimit(request, { limit: 30, windowMs: 60 * 1000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        user_id_session_id: {
          user_id: user.id,
          session_id: id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already favorited' }, { status: 400 });
    }

    // Create favorite
    const favorite = await prisma.favorite.create({
      data: {
        user_id: user.id,
        session_id: id,
      },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id]/favorite - Remove session from favorites
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete favorite
    await prisma.favorite.delete({
      where: {
        user_id_session_id: {
          user_id: user.id,
          session_id: id,
        },
      },
    });

    return NextResponse.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}

// GET /api/sessions/[id]/favorite - Check if session is favorited
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ isFavorited: false });
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        user_id_session_id: {
          user_id: user.id,
          session_id: id,
        },
      },
    });

    return NextResponse.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error('Error checking favorite:', error);
    return NextResponse.json({ isFavorited: false });
  }
}
