import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

// GET /api/sessions - List all sessions with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sportType = searchParams.get('sport_type');
    const skillLevel = searchParams.get('skill_level');
    const search = searchParams.get('search');

    const where: any = {
      date_time: {
        gte: new Date(), // Only future sessions
      },
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
    const {
      sport_center_id,
      sport_type,
      skill_level,
      date_time,
      duration_minutes,
      max_participants,
      description_en,
      description_ja,
    } = body;

    // Validate required fields
    if (
      !sport_center_id ||
      !sport_type ||
      !skill_level ||
      !date_time ||
      !duration_minutes
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const session = await prisma.session.create({
      data: {
        sport_center_id,
        sport_type,
        skill_level,
        date_time: new Date(date_time),
        duration_minutes: parseInt(duration_minutes),
        max_participants: max_participants ? parseInt(max_participants) : null,
        description_en,
        description_ja,
        created_by: user.id,
      },
      include: {
        sport_center: true,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
