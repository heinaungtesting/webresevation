import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// Zod schema for attendance marking
const MarkAttendanceSchema = z.object({
  attendees: z.array(
    z.object({
      user_id: z.string().uuid('Invalid user ID'),
      attended: z.boolean(),
    })
  ).min(1, 'At least one attendee must be provided'),
});

// Constants for reliability score calculation
const NO_SHOW_PENALTY = 10; // Points deducted per no-show
const MIN_RELIABILITY_SCORE = 0;
const MAX_RELIABILITY_SCORE = 100;

/**
 * Calculate new reliability score
 * Formula: Decreases by NO_SHOW_PENALTY for each no-show, minimum 0
 */
function calculateReliabilityScore(
  currentScore: number,
  currentNoShowCount: number,
  isNoShow: boolean
): number {
  if (!isNoShow) {
    // Slightly increase score for attending (rewards good behavior)
    // Max increase of 2 points per attendance, capped at 100
    return Math.min(MAX_RELIABILITY_SCORE, currentScore + 2);
  }

  // Decrease score for no-show
  return Math.max(MIN_RELIABILITY_SCORE, currentScore - NO_SHOW_PENALTY);
}

// GET /api/sessions/[id]/attendance - Get attendance status for a session
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session with participants
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        user_sessions: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                display_name: true,
                avatar_url: true,
                reliability_score: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if user is the host
    const isHost = session.created_by === user.id;

    // Only host can see full attendance details
    if (!isHost) {
      return NextResponse.json(
        { error: 'Only the session host can view attendance details' },
        { status: 403 }
      );
    }

    const participants = session.user_sessions.map((us: any) => ({
      user_id: us.user_id,
      user: us.user,
      status: us.status,
      marked_at: us.marked_at,
      attended_at: us.attended_at,
    }));

    return NextResponse.json({
      session_id: session.id,
      attendance_marked: session.attendance_marked,
      session_date: session.date_time,
      is_past: new Date(session.date_time) < new Date(),
      participants,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

// POST /api/sessions/[id]/attendance - Mark attendance for participants
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: 20 attendance operations per minute
  const rateLimitResponse = rateLimit(request, { limit: 20, windowMs: 60 * 1000 });
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

    const body = await request.json();

    // Validate input
    const validationResult = MarkAttendanceSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = (validationResult.error as any).errors?.map((e: any) => e.message).join(', ') || 'Invalid input';
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { attendees } = validationResult.data;

    // Get session
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        user_sessions: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Only host can mark attendance
    if (session.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Only the session host can mark attendance' },
        { status: 403 }
      );
    }

    // Session must be in the past
    if (new Date(session.date_time) > new Date()) {
      return NextResponse.json(
        { error: 'Cannot mark attendance for future sessions' },
        { status: 400 }
      );
    }

    // Check if attendance was already marked
    if (session.attendance_marked) {
      return NextResponse.json(
        { error: 'Attendance has already been marked for this session' },
        { status: 400 }
      );
    }

    // Validate that all user_ids in attendees are actual participants
    const participantIds = session.user_sessions.map((us: any) => us.user_id);
    const invalidUsers = attendees.filter((a) => !participantIds.includes(a.user_id));
    if (invalidUsers.length > 0) {
      return NextResponse.json(
        { error: `Some users are not participants: ${invalidUsers.map((u) => u.user_id).join(', ')}` },
        { status: 400 }
      );
    }

    // Use transaction to update all attendance records and user stats atomically
    const result = await prisma.$transaction(async (tx: any) => {
      const now = new Date();
      const updates = [];

      for (const attendee of attendees) {
        const newStatus = attendee.attended ? 'ATTENDED' : 'NO_SHOW';

        // Update UserSession status
        const updatedUserSession = await tx.userSession.update({
          where: {
            user_id_session_id: {
              user_id: attendee.user_id,
              session_id: id,
            },
          },
          data: {
            status: newStatus,
            attended_at: now,
          },
        });

        // If no-show, update user's reliability stats
        if (!attendee.attended) {
          const userRecord = await tx.user.findUnique({
            where: { id: attendee.user_id },
            select: { no_show_count: true, reliability_score: true },
          });

          if (userRecord) {
            const newScore = calculateReliabilityScore(
              userRecord.reliability_score,
              userRecord.no_show_count,
              true
            );

            await tx.user.update({
              where: { id: attendee.user_id },
              data: {
                no_show_count: { increment: 1 },
                reliability_score: newScore,
              },
            });

            // Create notification for no-show
            await tx.notification.create({
              data: {
                user_id: attendee.user_id,
                type: 'no_show_warning',
                title: 'Missed Session',
                message: `You were marked as a no-show for a session. Your reliability score has been updated.`,
                link: `/sessions/${id}`,
              },
            });
          }
        } else {
          // Reward attendance with slight score increase
          const userRecord = await tx.user.findUnique({
            where: { id: attendee.user_id },
            select: { reliability_score: true, no_show_count: true },
          });

          if (userRecord) {
            const newScore = calculateReliabilityScore(
              userRecord.reliability_score,
              userRecord.no_show_count,
              false
            );

            await tx.user.update({
              where: { id: attendee.user_id },
              data: {
                reliability_score: newScore,
              },
            });
          }
        }

        updates.push({
          user_id: attendee.user_id,
          status: newStatus,
        });
      }

      // Mark session as having attendance recorded
      await tx.session.update({
        where: { id },
        data: { attendance_marked: true },
      });

      return updates;
    });

    return NextResponse.json({
      message: 'Attendance marked successfully',
      updates: result,
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json(
      { error: 'Failed to mark attendance' },
      { status: 500 }
    );
  }
}
