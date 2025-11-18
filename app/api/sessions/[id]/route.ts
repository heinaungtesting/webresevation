import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/sessions/[id] - Get a single session
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        sport_center: true,
        user_sessions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: { user_sessions: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Map to include current_participants
    const sessionWithCount = {
      ...session,
      current_participants: session._count.user_sessions,
      _count: undefined,
    };

    return NextResponse.json(sessionWithCount);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id] - Delete a session
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.session.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

// PATCH /api/sessions/[id] - Update a session
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const session = await prisma.session.update({
      where: { id },
      data: body,
      include: {
        sport_center: true,
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
