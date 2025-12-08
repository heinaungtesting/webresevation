import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/users/me/notifications - Get user's notifications
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { user_id: user.id };
    if (unreadOnly) {
      where.read = false;
    }

    // Execute both queries in parallel for better performance
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: {
          user_id: user.id,
          read: false,
        },
      }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/me/notifications - Mark notifications as read
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAll } = body;

    if (markAll) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          user_id: user.id,
          read: false,
        },
        data: { read: true },
      });
    } else if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          user_id: user.id,
        },
        data: { read: true },
      });
    }

    return NextResponse.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/me/notifications - Delete notifications
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deleteAll = searchParams.get('all') === 'true';
    const notificationId = searchParams.get('id');

    if (deleteAll) {
      await prisma.notification.deleteMany({
        where: { user_id: user.id },
      });
    } else if (notificationId) {
      await prisma.notification.delete({
        where: {
          id: notificationId,
          user_id: user.id,
        },
      });
    }

    return NextResponse.json({ message: 'Notifications deleted' });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}
