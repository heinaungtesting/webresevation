import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Zod schema for session creation validation
const CreateSessionSchema = z.object({
  sport_center_id: z.string().uuid('Invalid sport center ID'),
  sport_type: z.string().min(1, 'Sport type is required'),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced'] as const),
  date_time: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    'Invalid date/time format'
  ),
  duration_minutes: z.union([z.number(), z.string()])
    .transform((val) => typeof val === 'string' ? parseInt(val, 10) : val)
    .pipe(z.number().min(1, 'Duration must be at least 1 minute').max(480, 'Duration cannot exceed 8 hours')),
  max_participants: z.union([z.number(), z.string(), z.null()])
    .optional()
    .transform((val) => {
      if (val === null || val === undefined) return null;
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      return isNaN(num) ? null : num;
    })
    .pipe(z.number().min(2, 'Must allow at least 2 participants').nullable()),
  description_en: z.string().max(1000, 'Description too long').optional(),
  description_ja: z.string().max(1000, 'Description too long').optional(),
});

// GET /api/sessions - List all sessions with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sportType = searchParams.get('sport_type');
    const skillLevel = searchParams.get('skill_level');
    const search = searchParams.get('search');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build date filter
    const dateFilter: any = {
      gte: new Date(), // Default: Only future sessions
    };

    // If start date is provided, use it (but ensure it's not in the past)
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.gte = start > new Date() ? start : new Date();
    }

    // If end date is provided, set the upper bound
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const where: any = {
      date_time: dateFilter,
    };

    if (sportType && sportType !== 'all') {
      where.sport_type = sportType;
    }

    if (skillLevel && skillLevel !== 'all') {
      where.skill_level = skillLevel;
    }

    if (search) {
      where.OR = [
        { sport_type: { contains: search, mode: 'insensitive' } },
        { sport_center: { name_en: { contains: search, mode: 'insensitive' } } },
        { sport_center: { name_ja: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        sport_center: true,
        _count: {
          select: { user_sessions: true },
        },
      },
      orderBy: {
        date_time: 'asc',
      },
    });

    // Map to include current_participants
    const sessionsWithCounts = sessions.map((session: any) => ({
      ...session,
      current_participants: session._count.user_sessions,
      _count: undefined,
    }));

    return NextResponse.json(sessionsWithCounts);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create a new session
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

    // Validate input with Zod schema
    const validationResult = CreateSessionSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = (validationResult.error as any).errors.map((e: any) => e.message).join(', ');
      return NextResponse.json(
        { error: errors },
        { status: 400 }
      );
    }

    const {
      sport_center_id,
      sport_type,
      skill_level,
      date_time,
      duration_minutes,
      max_participants,
      description_en,
      description_ja,
    } = validationResult.data;

    // Use transaction to create session and auto-join creator
    const session = await prisma.$transaction(async (tx: any) => {
      const newSession = await tx.session.create({
        data: {
          sport_center_id,
          sport_type,
          skill_level,
          date_time: new Date(date_time),
          duration_minutes,
          max_participants,
          description_en,
          description_ja,
          created_by: user.id,
        },
      });

      // Auto-join creator as first participant
      await tx.userSession.create({
        data: {
          user_id: user.id,
          session_id: newSession.id,
        },
      });

      // Return session with sport_center and participant count
      return tx.session.findUnique({
        where: { id: newSession.id },
        include: {
          sport_center: true,
          _count: {
            select: { user_sessions: true },
          },
        },
      });
    });

    return NextResponse.json({
      ...session,
      current_participants: session?._count?.user_sessions || 1,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
