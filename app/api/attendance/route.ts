import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

// POST /api/attendance - Mark attendance for a session
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { session_id } = await request.json();

    if (!session_id) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Check if session exists and has space
    const session = await prisma.session.findUnique({
      where: { id: session_id },
      include: {
        _count: {
          select: { user_sessions: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if session is full
    if (
      session.max_participants &&
      session._count.user_sessions >= session.max_participants
    ) {
      return NextResponse.json({ error: 'Session is full' }, { status: 400 });
    }

    // Check if user already marked attendance
    const existingAttendance = await prisma.userSession.findUnique({
      where: {
        user_id_session_id: {
          user_id: user.id,
          session_id,
        },
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'Already marked attendance for this session' },
        { status: 400 }
      );
    }

    // Create attendance record
    const attendance = await prisma.userSession.create({
      data: {
        user_id: user.id,
        session_id,
      },
    });

    return NextResponse.json(
      { message: 'Attendance marked successfully', attendance },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json(
      { error: 'Failed to mark attendance' },
      { status: 500 }
    );
  }
}

// DELETE /api/attendance - Cancel attendance
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { session_id } = await request.json();

    if (!session_id) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Delete attendance record
    await prisma.userSession.delete({
      where: {
        user_id_session_id: {
          user_id: user.id,
          session_id,
        },
      },
    });

    return NextResponse.json({ message: 'Attendance cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling attendance:', error);
    return NextResponse.json(
      { error: 'Failed to cancel attendance' },
      { status: 500 }
    );
  }
}
