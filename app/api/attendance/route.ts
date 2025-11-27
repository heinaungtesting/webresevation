import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { ensureUserExists } from '@/lib/ensure-user';

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

    // CRITICAL: Ensure user exists in database before creating attendance
    // This prevents P2003 foreign key constraint errors
    try {
      await ensureUserExists(user);
    } catch (error: any) {
      console.error('[/api/attendance] Failed to ensure user exists:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to sync user account. Please try logging out and back in.' },
        { status: 500 }
      );
    }

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

      // Check if session is in the past (cannot join past sessions)
      if (new Date(session.date_time) < new Date()) {
        throw new Error('SESSION_PAST');
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
      maxWait: 10000, // Maximum time to wait for a transaction slot (10 seconds)
      timeout: 10000, // Maximum time for the transaction to complete (10 seconds)
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
    if (error.message === 'SESSION_PAST') {
      return NextResponse.json(
        { error: 'Cannot join past sessions' },
        { status: 400 }
      );
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

    // Use transaction to delete attendance and notify waitlist
    const result = await prisma.$transaction(async (tx: any) => {
      // Get session info first
      const session = await tx.session.findUnique({
        where: { id: session_id },
        select: {
          id: true,
          sport_type: true,
          date_time: true,
          max_participants: true,
        },
      });

      if (!session) {
        throw new Error('SESSION_NOT_FOUND');
      }

      // Delete attendance record
      await tx.userSession.delete({
        where: {
          user_id_session_id: {
            user_id: user.id,
            session_id,
          },
        },
      });

      // Check if session is still in the future
      if (new Date(session.date_time) < new Date()) {
        return { notified: false };
      }

      // Find the first person on the waitlist who hasn't been notified recently
      const nextInLine = await tx.waitlist.findFirst({
        where: {
          session_id,
          notified: false,
        },
        orderBy: { created_at: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              display_name: true,
              email: true,
            },
          },
        },
      });

      if (nextInLine) {
        // Mark as notified
        await tx.waitlist.update({
          where: { id: nextInLine.id },
          data: {
            notified: true,
            notified_at: new Date(),
          },
        });

        // Create notification for the waitlisted user
        await tx.notification.create({
          data: {
            user_id: nextInLine.user_id,
            type: 'waitlist_spot_available',
            title: 'Spot Available! 🎉',
            message: `A spot just opened up for ${session.sport_type}! Join now before it's taken.`,
            link: `/sessions/${session_id}`,
          },
        });

        return {
          notified: true,
          notifiedUser: nextInLine.user.display_name || nextInLine.user.email,
        };
      }

      return { notified: false };
    }, {
      maxWait: 10000, // Maximum time to wait for a transaction slot (10 seconds)
      timeout: 10000, // Maximum time for the transaction to complete (10 seconds)
    });

    return NextResponse.json({
      message: 'Attendance cancelled successfully',
      waitlistNotified: result.notified,
    });
  } catch (error: any) {
    console.error('Error cancelling attendance:', error);

    // Handle specific errors
    if (error.message === 'SESSION_NOT_FOUND') {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

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
