import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

// GET /api/sessions/[id]/reviews - Get all reviews for a session
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reviews = await prisma.review.findMany({
      where: { session_id: id },
      include: {
        user: {
          select: {
            id: true,
            display_name: true,
            username: true,
            avatar_url: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Calculate average rating
    const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return NextResponse.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/sessions/[id]/reviews - Create a review
export async function POST(
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

    const body = await request.json();
    const { rating, comment } = body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Prevent session creators from reviewing their own sessions
    if (session.created_by === user.id) {
      return NextResponse.json(
        { error: 'You cannot review your own session' },
        { status: 400 }
      );
    }

    // Check if session is in the past
    if (new Date(session.date_time) > new Date()) {
      return NextResponse.json(
        { error: 'Cannot review a session that has not happened yet' },
        { status: 400 }
      );
    }

    // Check if user attended the session
    const attended = await prisma.userSession.findUnique({
      where: {
        user_id_session_id: {
          user_id: user.id,
          session_id: id,
        },
      },
    });

    if (!attended) {
      return NextResponse.json(
        { error: 'You can only review sessions you attended' },
        { status: 400 }
      );
    }

    // Check if user already reviewed
    const existingReview = await prisma.review.findUnique({
      where: {
        user_id_session_id: {
          user_id: user.id,
          session_id: id,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this session' },
        { status: 400 }
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        user_id: user.id,
        session_id: id,
        rating: parseInt(rating),
        comment: comment || null,
      },
      include: {
        user: {
          select: {
            id: true,
            display_name: true,
            username: true,
            avatar_url: true,
          },
        },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
