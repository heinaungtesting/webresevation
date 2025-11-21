import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Helper to check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { is_admin: true },
  });
  return user?.is_admin === true;
}

// GET /api/admin/reports - Get all reports (admin only)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const entityType = searchParams.get('entity_type');

    const where: any = {};

    if (status && ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'].includes(status)) {
      where.status = status;
    }

    if (entityType && ['USER', 'SESSION'].includes(entityType)) {
      where.entity_type = entityType;
    }

    const reports = await prisma.report.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // PENDING first
        { created_at: 'desc' },
      ],
      include: {
        reporter: {
          select: {
            id: true,
            display_name: true,
            username: true,
            email: true,
          },
        },
        reported_user: {
          select: {
            id: true,
            display_name: true,
            username: true,
            email: true,
            is_banned: true,
            no_show_count: true,
            reliability_score: true,
          },
        },
        session: {
          select: {
            id: true,
            sport_type: true,
            date_time: true,
            creator: {
              select: {
                id: true,
                display_name: true,
                username: true,
              },
            },
          },
        },
      },
    });

    // Get counts by status
    const counts = await prisma.report.groupBy({
      by: ['status'],
      _count: true,
    });

    const statusCounts = {
      PENDING: 0,
      REVIEWED: 0,
      RESOLVED: 0,
      DISMISSED: 0,
    };
    counts.forEach((c: any) => {
      statusCounts[c.status as keyof typeof statusCounts] = c._count;
    });

    return NextResponse.json({
      reports,
      counts: statusCounts,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/reports - Update report status
const UpdateReportSchema = z.object({
  report_id: z.string().uuid('Invalid report ID'),
  status: z.enum(['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED']),
  admin_notes: z.string().max(2000).optional(),
});

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = UpdateReportSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = (validationResult.error as any).errors.map((e: any) => e.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { report_id, status, admin_notes } = validationResult.data;

    const report = await prisma.report.update({
      where: { id: report_id },
      data: {
        status,
        admin_notes,
        resolved_by: ['RESOLVED', 'DISMISSED'].includes(status) ? user.id : null,
        resolved_at: ['RESOLVED', 'DISMISSED'].includes(status) ? new Date() : null,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

// POST /api/admin/reports - Ban user action
const BanUserSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  reason: z.string().min(1, 'Ban reason is required').max(500),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = BanUserSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = (validationResult.error as any).errors.map((e: any) => e.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { user_id, reason } = validationResult.data;

    // Prevent self-ban
    if (user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot ban yourself' },
        { status: 400 }
      );
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: user_id },
      select: { id: true, is_admin: true, is_banned: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent banning other admins
    if (targetUser.is_admin) {
      return NextResponse.json(
        { error: 'Cannot ban admin users' },
        { status: 400 }
      );
    }

    // Use transaction to ban user and resolve all their pending reports
    const result = await prisma.$transaction(async (tx: any) => {
      // Ban the user
      const bannedUser = await tx.user.update({
        where: { id: user_id },
        data: {
          is_banned: true,
          banned_at: new Date(),
          banned_reason: reason,
        },
        select: {
          id: true,
          display_name: true,
          username: true,
          email: true,
          is_banned: true,
          banned_at: true,
          banned_reason: true,
        },
      });

      // Resolve all pending reports against this user
      await tx.report.updateMany({
        where: {
          reported_user_id: user_id,
          status: 'PENDING',
        },
        data: {
          status: 'RESOLVED',
          admin_notes: `User banned. Reason: ${reason}`,
          resolved_by: user.id,
          resolved_at: new Date(),
        },
      });

      return bannedUser;
    });

    return NextResponse.json({
      success: true,
      message: 'User has been banned',
      user: result,
    });
  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json(
      { error: 'Failed to ban user' },
      { status: 500 }
    );
  }
}
