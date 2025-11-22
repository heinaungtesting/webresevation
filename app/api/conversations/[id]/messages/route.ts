import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { sendMessageNotificationEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// GET /api/conversations/[id]/messages - Get messages for a conversation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // For pagination

    // Validate 'before' date parameter to prevent invalid date errors
    let beforeDate: Date | undefined;
    if (before) {
      beforeDate = new Date(before);
      if (isNaN(beforeDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format for "before" parameter' },
          { status: 400 }
        );
      }
    }

    // Check if user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversation_id: id,
        user_id: user.id,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversation_id: id,
        ...(beforeDate && {
          created_at: {
            lt: beforeDate,
          },
        }),
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
    });

    return NextResponse.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Send a message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: 30 messages per minute
  const rateLimitResponse = await rateLimit(request, { limit: 30, windowMs: 60 * 1000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Check if user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversation_id: id,
        user_id: user.id,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create message and update conversation
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversation_id: id,
          sender_id: user.id,
          content: content.trim(),
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              username: true,
              display_name: true,
            },
          },
        },
      }),
      prisma.conversation.update({
        where: { id },
        data: {
          last_message_at: new Date(),
        },
      }),
    ]);

    // Send email notifications to other participants (non-blocking)
    const otherParticipants = await prisma.conversationParticipant.findMany({
      where: {
        conversation_id: id,
        user_id: { not: user.id }, // Exclude sender
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            display_name: true,
            notification_email: true,
          },
        },
      },
    });

    // Send notifications in background
    const senderName = message.sender.display_name || message.sender.username || message.sender.email.split('@')[0];
    const messagePreview = content.length > 100 ? content.substring(0, 100) + '...' : content;

    otherParticipants.forEach((participant: any) => {
      if (participant.user.notification_email) {
        const userName = participant.user.display_name || participant.user.username || participant.user.email.split('@')[0];
        sendMessageNotificationEmail(
          participant.user.email,
          userName,
          {
            senderName,
            messagePreview,
            conversationId: id,
          }
        ).catch((err) => {
          console.error('Failed to send message notification email:', err);
        });
      }
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
