import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { createConversationSchema, validateRequestBody } from '@/lib/validations';

export const dynamic = 'force-dynamic';

// GET /api/conversations - Get all conversations for current user
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get conversations with all related data in a single query
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            user_id: user.id,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                display_name: true,
                avatar_url: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            created_at: 'desc',
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                username: true,
              },
            },
          },
        },
        session: {
          select: {
            id: true,
            sport_type: true,
            date_time: true,
          },
        },
      },
      orderBy: {
        last_message_at: 'desc',
      },
    });

    // If no conversations, return empty array early
    if (conversations.length === 0) {
      return NextResponse.json([]);
    }

    // Get unread counts for ALL conversations in a SINGLE query (fixes N+1)
    // Using raw SQL for optimal performance
    const conversationIds = conversations.map((c: any) => c.id);

    // Build the unread counts map using a single aggregated query
    // Using PostgreSQL's ANY() operator with array parameter (cleaner than IN clause)
    const unreadCounts = await prisma.$queryRaw<Array<{ conversation_id: string; unread_count: bigint }>>`
      SELECT
        m.conversation_id,
        COUNT(m.id) as unread_count
      FROM "Message" m
      INNER JOIN "ConversationParticipant" cp
        ON cp.conversation_id = m.conversation_id
        AND cp.user_id = ${user.id}::uuid
      WHERE
        m.conversation_id = ANY(${conversationIds}::uuid[])
        AND m.sender_id != ${user.id}::uuid
        AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamp)
      GROUP BY m.conversation_id
    `;

    // Create a map for O(1) lookup
    const unreadCountMap = new Map<string, number>();
    unreadCounts.forEach((row: { conversation_id: string; unread_count: bigint }) => {
      unreadCountMap.set(row.conversation_id, Number(row.unread_count));
    });

    // Merge unread counts with conversations
    const conversationsWithUnread = conversations.map((conv: any) => ({
      ...conv,
      unread_count: unreadCountMap.get(conv.id) || 0,
    }));

    return NextResponse.json(conversationsWithUnread);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create a new conversation
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
    const validation = validateRequestBody(createConversationSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { participant_ids, type } = validation.data;

    // Check if conversation already exists for direct messages
    if (type === 'direct' && participant_ids.length === 1) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type: 'direct',
          AND: [
            {
              participants: {
                some: {
                  user_id: user.id,
                },
              },
            },
            {
              participants: {
                some: {
                  user_id: participant_ids[0],
                },
              },
            },
          ],
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                },
              },
            },
          },
        },
      });

      if (existingConversation) {
        return NextResponse.json(existingConversation);
      }
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        type,
        participants: {
          create: [
            { user_id: user.id },
            ...participant_ids.map((id) => ({ user_id: id })),
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
