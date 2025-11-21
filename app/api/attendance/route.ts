import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Zod schemas for input validation
const AttendanceSchema = z.object({
  session_id: z.string().uuid('Invalid session ID format'),
});

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

    const body = await request.json();

    // Validate input with Zod
    const validationResult = AttendanceSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = (validationResult.error as any).errors.map((e: any) => e.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { session_id } = validationResult.data;

    // Use a transaction to prevent race conditions
    // This ensures atomicity between checking capacity and creating the record
    const result = await prisma.$transaction(async (tx: any) => {
      // Check if session exists and get current participant count
      const session = await tx.session.findUnique({
        where: { id: session_id },
        include: {
          _count: {
            select: { user_sessions: true },
          },
        },
      });

      if (!session) {
        throw new Error('SESSION_NOT_FOUND');
      }

      // Check if session is full
      if (
        session.max_participants &&
        session._count.user_sessions >= session.max_participants
      ) {
        throw new Error('SESSION_FULL');
      }

      // Check if user already marked attendance
      const existingAttendance = await tx.userSession.findUnique({
        where: {
          user_id_session_id: {
            user_id: user.id,
            session_id,
          },
        },
      });

      if (existingAttendance) {
        throw new Error('ALREADY_JOINED');
      }

      // Create attendance record within the same transaction
      const attendance = await tx.userSession.create({
        data: {
          user_id: user.id,
          session_id,
        },
      });

      return attendance;
    }, {
      // Use serializable isolation for strongest consistency
      // This prevents phantom reads and ensures accurate count
      isolationLevel: 'Serializable',
    });

    return NextResponse.json(
      { message: 'Attendance marked successfully', attendance: result },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error marking attendance:', error);

    // Handle specific transaction errors
    if (error.message === 'SESSION_NOT_FOUND') {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (error.message === 'SESSION_FULL') {
      return NextResponse.json({ error: 'Session is full' }, { status: 400 });
    }
    if (error.message === 'ALREADY_JOINED') {
      return NextResponse.json(
        { error: 'Already marked attendance for this session' },
        { status: 400 }
      );
    }

    // Handle Prisma unique constraint violation (backup for race condition)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Already marked attendance for this session' },
        { status: 400 }
      );
    }

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

    const body = await request.json();

    // Validate input with Zod
    const validationResult = AttendanceSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = (validationResult.error as any).errors.map((e: any) => e.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { session_id } = validationResult.data;

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
  } catch (error: any) {
    console.error('Error cancelling attendance:', error);

    // Handle case where attendance record doesn't exist
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to cancel attendance' },
      { status: 500 }
    );
  }
}
