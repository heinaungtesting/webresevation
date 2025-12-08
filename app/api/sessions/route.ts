import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { apiRateLimiter } from '@/lib/rate-limit';
import { sessionCache, sessionListKey } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// Valid session vibes
const VALID_VIBES = ['COMPETITIVE', 'CASUAL', 'ACADEMY', 'LANGUAGE_EXCHANGE'] as const;

// Zod schema for session creation validation
const CreateSessionSchema = z.object({
  sport_center_id: z.string().uuid('Invalid sport center ID'),
  sport_type: z.string().min(1, 'Sport type is required'),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced'] as const),
  date_time: z.string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid date/time format'
    )
    .refine(
      (val) => new Date(val) > new Date(),
      'Session date must be in the future'
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
  description_en: z.string().max(5000, 'Description too long').optional(),
  description_ja: z.string().max(5000, 'Description too long').optional(),
  // Language exchange & vibe fields
  primary_language: z.string().length(2, 'Language code must be 2 characters').default('ja'),
  allow_english: z.boolean().default(false),
  vibe: z.enum(VALID_VIBES).default('CASUAL'),
});

/**
 * Helper function to get today's date range
 */
function getTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start, end };
}

/**
 * Helper function to get this weekend's date range
 */
function getWeekendRange(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // Calculate days until Saturday (0 = Sunday, 6 = Saturday)
  const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

  // If today is Saturday or Sunday, include today
  const saturday = new Date(now);
  const sunday = new Date(now);

  if (dayOfWeek === 6) {
    // Today is Saturday
    saturday.setHours(0, 0, 0, 0);
    sunday.setDate(now.getDate() + 1);
  } else if (dayOfWeek === 0) {
    // Today is Sunday
    saturday.setDate(now.getDate() - 1);
    saturday.setHours(0, 0, 0, 0);
    sunday.setHours(0, 0, 0, 0);
  } else {
    // Weekday - calculate next weekend
    saturday.setDate(now.getDate() + daysUntilSaturday);
    saturday.setHours(0, 0, 0, 0);
    sunday.setDate(now.getDate() + daysUntilSunday);
  }

  sunday.setHours(23, 59, 59, 999);

  return { start: saturday, end: sunday };
}

// Pagination defaults
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// GET /api/sessions - List all sessions with filters and pagination
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sportType = searchParams.get('sport_type');
    const skillLevel = searchParams.get('skill_level');
    const search = searchParams.get('search');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const dateFilter = searchParams.get('date'); // 'today', 'weekend', or null
    // Language exchange & vibe filters
    const vibe = searchParams.get('vibe'); // 'COMPETITIVE', 'CASUAL', 'ACADEMY', 'LANGUAGE_EXCHANGE'
    const allowEnglish = searchParams.get('allow_english'); // 'true' or 'false'

    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10)));
    const skip = (page - 1) * limit;

    // Build date filter based on date parameter
    let dateRange: { gte: Date; lte?: Date } = {
      gte: new Date(), // Default: Only future sessions
    };

    // Handle special date filters
    if (dateFilter === 'today') {
      const { start, end } = getTodayRange();
      // Ensure we don't show past sessions even if today
      dateRange = {
        gte: new Date() > start ? new Date() : start,
        lte: end,
      };
    } else if (dateFilter === 'weekend') {
      const { start, end } = getWeekendRange();
      // Ensure we don't show past sessions
      dateRange = {
        gte: new Date() > start ? new Date() : start,
        lte: end,
      };
    } else {
      // Custom date range
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateRange.gte = start > new Date() ? start : new Date();
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateRange.lte = end;
      }
    }

    const where: any = {
      date_time: dateRange,
    };

    if (sportType && sportType !== 'all') {
      where.sport_type = sportType;
    }

    if (skillLevel && skillLevel !== 'all') {
      where.skill_level = skillLevel;
    }

    // Vibe filter
    if (vibe && VALID_VIBES.includes(vibe as any)) {
      where.vibe = vibe;
    }

    // English-friendly filter
    if (allowEnglish === 'true') {
      where.allow_english = true;
    }

    if (search) {
      where.OR = [
        { sport_type: { contains: search, mode: 'insensitive' } },
        { sport_center: { name_en: { contains: search, mode: 'insensitive' } } },
        { sport_center: { name_ja: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Generate cache key based on query parameters
    const cacheKey = sessionListKey({
      sportType: sportType || 'all',
      skillLevel: skillLevel || 'all',
      search: search || '',
      dateFilter: dateFilter || '',
      startDate: startDate || '',
      endDate: endDate || '',
      vibe: vibe || '',
      allowEnglish: allowEnglish || '',
      page,
      limit,
    });

    // Try to get from cache first
    const cachedResult = await sessionCache.get<any>(cacheKey);
    if (cachedResult) {
      return NextResponse.json(cachedResult);
    }

    // Execute count and data queries in parallel for efficiency
    const [sessions, totalCount] = await Promise.all([
      prisma.session.findMany({
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
        skip,
        take: limit,
      }),
      prisma.session.count({ where }),
    ]);

    // Map to include current_participants
    const sessionsWithCounts = sessions.map((session: any) => ({
      ...session,
      current_participants: session._count.user_sessions,
      _count: undefined,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const result = {
      data: sessionsWithCounts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };

    // Store in cache (non-blocking)
    sessionCache.set(cacheKey, result).catch((err) => {
      console.error('Failed to cache sessions:', err);
    });

    return NextResponse.json(result);
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
  // Apply rate limiting to prevent session creation abuse
  const rateLimitResponse = apiRateLimiter.limit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

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
      const errors = validationResult.error.issues.map((e) => e.message).join(', ');
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
      primary_language,
      allow_english,
      vibe,
    } = validationResult.data;

    // Use transaction to create session and auto-join creator
    const newSession = await prisma.$transaction(async (tx: any) => {
      const session = await tx.session.create({
        data: {
          sport_center_id,
          sport_type,
          skill_level,
          date_time: new Date(date_time),
          duration_minutes,
          max_participants,
          description_en,
          description_ja,
          // Language exchange & vibe fields
          primary_language,
          allow_english,
          vibe,
          created_by: user.id,
        },
      });

      // Auto-join creator as first participant
      await tx.userSession.create({
        data: {
          user_id: user.id,
          session_id: session.id,
        },
      });

      return session;
    });

    // Invalidate session list cache when a new session is created
    // Use pattern matching to clear all cached session lists
    import('@/lib/cache').then(({ cacheDeletePattern }) => {
      cacheDeletePattern('list:*', { prefix: 'session' }).catch((err) => {
        console.error('Failed to invalidate session cache:', err);
      });
    });

    // Fetch sport_center separately (outside transaction for better performance)
    const sport_center = await prisma.sportCenter.findUnique({
      where: { id: newSession.sport_center_id },
    });

    return NextResponse.json({
      ...newSession,
      sport_center,
      current_participants: 1, // Creator is the first participant
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
