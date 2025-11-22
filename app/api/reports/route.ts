import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// Valid report reasons and entity types
const VALID_REASONS = ['HARASSMENT', 'NO_SHOW', 'SPAM', 'CREEPY_BEHAVIOR', 'FAKE_PROFILE', 'OTHER'] as const;
const VALID_ENTITY_TYPES = ['USER', 'SESSION'] as const;

// Zod schema for report creation validation
const CreateReportSchema = z.object({
  entity_type: z.enum(VALID_ENTITY_TYPES, {
    message: 'Invalid entity type. Must be USER or SESSION',
  }),
  reported_user_id: z.string().uuid('Invalid user ID').optional(),
  session_id: z.string().uuid('Invalid session ID').optional(),
  reason: z.enum(VALID_REASONS, {
    message: 'Invalid report reason',
  }),
  description: z.string().max(2000, 'Description too long').optional(),
}).refine(
  (data) => {
    // Validate that the correct ID is provided based on entity_type
    if (data.entity_type === 'USER') {
      return !!data.reported_user_id;
    }
    if (data.entity_type === 'SESSION') {
      return !!data.session_id;
    }
    return false;
  },
  {
    message: 'You must provide reported_user_id for USER reports or session_id for SESSION reports',
  }
);

// POST /api/reports - Create a new report
export async function POST(request: Request) {
  // Rate limit: 5 reports per minute (strict to prevent abuse)
  const rateLimitResponse = await rateLimit(request, { limit: 5, windowMs: 60 * 1000 });
  if (rateLimitResponse) return rateLimitResponse;

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
    const validationResult = CreateReportSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = (validationResult.error as any).errors.map((e: any) => e.message).join(', ');
      return NextResponse.json(
        { error: errors },
        { status: 400 }
      );
    }

    const { entity_type, reported_user_id, session_id, reason, description } = validationResult.data;

    // Prevent self-reporting
    if (entity_type === 'USER' && reported_user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot report yourself' },
        { status: 400 }
      );
    }

    // Verify the reported entity exists
    if (entity_type === 'USER' && reported_user_id) {
      const reportedUser = await prisma.user.findUnique({
        where: { id: reported_user_id },
        select: { id: true },
      });
      if (!reportedUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
    }

    if (entity_type === 'SESSION' && session_id) {
      const reportedSession = await prisma.session.findUnique({
        where: { id: session_id },
        select: { id: true },
      });
      if (!reportedSession) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
    }

    // Check for duplicate reports (same reporter, same entity)
    const existingReport = await prisma.report.findFirst({
      where: {
        reporter_id: user.id,
        entity_type,
        ...(entity_type === 'USER' ? { reported_user_id } : { session_id }),
        status: 'PENDING', // Only check pending reports
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already submitted a report for this. Our team is reviewing it.' },
        { status: 409 }
      );
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        reporter_id: user.id,
        entity_type,
        reported_user_id: entity_type === 'USER' ? reported_user_id : null,
        session_id: entity_type === 'SESSION' ? session_id : null,
        reason,
        description: description || null,
      },
      include: {
        reported_user: {
          select: {
            id: true,
            display_name: true,
            username: true,
          },
        },
        session: {
          select: {
            id: true,
            sport_type: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Report submitted successfully. Our team will review it shortly.',
        report: {
          id: report.id,
          entity_type: report.entity_type,
          reason: report.reason,
          status: report.status,
          created_at: report.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    );
  }
}

// GET /api/reports - Get user's own reports (for reference)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reports = await prisma.report.findMany({
      where: {
        reporter_id: user.id,
      },
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        entity_type: true,
        reason: true,
        status: true,
        created_at: true,
        reported_user: {
          select: {
            id: true,
            display_name: true,
            username: true,
          },
        },
        session: {
          select: {
            id: true,
            sport_type: true,
          },
        },
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
