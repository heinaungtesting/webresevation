import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { sendSessionUpdateEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

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
                display_name: true,
                avatar_url: true,
                // Note: email intentionally excluded for privacy
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

    // Map to include current_participants and participants array
    const sessionWithCount = {
      ...session,
      current_participants: session._count.user_sessions,
      participants: session.user_sessions.map((us: any) => us.user),
      user_sessions: undefined,
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

// DELETE /api/sessions/[id] - Cancel/delete a session (creator only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if session exists and user is the creator
    const existingSession = await prisma.session.findUnique({
      where: { id },
      include: {
        sport_center: true,
        user_sessions: {
          include: {
            user: {
              select: {
                email: true,
                username: true,
                display_name: true,
                notification_email: true,
              },
            },
          },
        },
      },
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (existingSession.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Only the session creator can delete this session' },
        { status: 403 }
      );
    }

    // Delete the session
    await prisma.session.delete({
      where: { id },
    });

    // Send cancellation notifications to all participants (non-blocking)
    existingSession.user_sessions.forEach((participant: any) => {
      if (participant.user.notification_email && participant.user_id !== user.id) {
        const userName = participant.user.display_name || participant.user.username || participant.user.email.split('@')[0];

        sendSessionUpdateEmail(
          participant.user.email,
          userName,
          {
            sportType: existingSession.sport_type.charAt(0).toUpperCase() + existingSession.sport_type.slice(1),
            updateType: 'cancelled',
            sportCenter: existingSession.sport_center.name_en,
          }
        ).catch((err) => {
          console.error('Failed to send session cancellation email:', err);
        });
      }
    });

    return NextResponse.json({ message: 'Session cancelled successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

// PATCH /api/sessions/[id] - Update a session (creator only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check if session exists and user is the creator
    const existingSession = await prisma.session.findUnique({
      where: { id },
      include: {
        sport_center: true,
        user_sessions: {
          include: {
            user: {
              select: {
                email: true,
                username: true,
                display_name: true,
                notification_email: true,
              },
            },
          },
        },
      },
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (existingSession.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Only the session creator can update this session' },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (body.sport_center_id !== undefined) updateData.sport_center_id = body.sport_center_id;
    if (body.sport_type !== undefined) updateData.sport_type = body.sport_type;
    if (body.skill_level !== undefined) updateData.skill_level = body.skill_level;
    if (body.date_time !== undefined) updateData.date_time = new Date(body.date_time);
    if (body.duration_minutes !== undefined) updateData.duration_minutes = parseInt(body.duration_minutes);
    if (body.max_participants !== undefined) updateData.max_participants = body.max_participants ? parseInt(body.max_participants) : null;
    if (body.description_en !== undefined) updateData.description_en = body.description_en || null;
    if (body.description_ja !== undefined) updateData.description_ja = body.description_ja || null;

    const updatedSession = await prisma.session.update({
      where: { id },
      data: updateData,
      include: {
        sport_center: true,
      },
    });

    // Send update notifications to participants (non-blocking)
    const dateChanged = body.date_time && new Date(body.date_time).getTime() !== existingSession.date_time.getTime();

    if (dateChanged) {
      existingSession.user_sessions.forEach((participant: any) => {
        if (participant.user.notification_email && participant.user_id !== user.id) {
          const userName = participant.user.display_name || participant.user.username || participant.user.email.split('@')[0];
          const newDateTime = new Date(body.date_time).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          sendSessionUpdateEmail(
            participant.user.email,
            userName,
            {
              sportType: updatedSession.sport_type.charAt(0).toUpperCase() + updatedSession.sport_type.slice(1),
              updateType: 'modified',
              sportCenter: updatedSession.sport_center.name_en,
              newDateTime,
            }
          ).catch((err) => {
            console.error('Failed to send session update email:', err);
          });
        }
      });
    }

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
