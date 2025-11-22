import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { Prisma } from '@prisma/client';

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

    // First, get all conversations with their data
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

    // Get conversation IDs for the batch query
    const conversationIds = conversations.map((c: { id: string }) => c.id);

    // If no conversations, return early
    if (conversationIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get all unread counts in a single query using raw SQL
    // This replaces N individual queries with 1 aggregated query
    const unreadCounts = await prisma.$queryRaw<Array<{ conversation_id: string; unread_count: bigint }>>`
      SELECT
        m.conversation_id,
        COUNT(m.id) as unread_count
      FROM "Message" m
      INNER JOIN "ConversationParticipant" cp
        ON cp.conversation_id = m.conversation_id
        AND cp.user_id = ${user.id}
      WHERE
        m.conversation_id = ANY(${conversationIds}::text[])
        AND m.sender_id != ${user.id}
        AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamp)
      GROUP BY m.conversation_id
    `.catch((err: Error) => {
      // Fallback: If raw query fails, log and use Prisma's approach
      console.error('Raw query failed, using fallback:', err);
      return null;
    });

    // Create a map for quick lookup
    let unreadCountMap: Map<string, number>;

    if (unreadCounts) {
      // Use raw query results
      unreadCountMap = new Map(
        unreadCounts.map((row: { conversation_id: string; unread_count: bigint }) => [row.conversation_id, Number(row.unread_count)])
      );
    } else {
      // Fallback: Use Promise.all but with optimized batching
      type ConversationType = typeof conversations[number];
      const counts = await Promise.all(
        conversations.map(async (conv: ConversationType) => {
          const participant = conv.participants.find((p: { user_id: string }) => p.user_id === user.id);
          const count = await prisma.message.count({
            where: {
              conversation_id: conv.id,
              sender_id: { not: user.id },
              created_at: {
                gt: participant?.last_read_at || new Date(0),
              },
            },
          });
          return { id: conv.id, count };
        })
      );
      unreadCountMap = new Map(counts.map((c: { id: string; count: number }) => [c.id, c.count]));
    }

    // Merge conversations with unread counts
    type ConversationType2 = typeof conversations[number];
    const conversationsWithUnread = conversations.map((conv: ConversationType2) => ({
      ...conv,
      unread_count: unreadCountMap.get(conv.id) || 0,
    }));

    return NextResponse.json(conversationsWithUnread);
  } catch (error) {
    console.error('Error fetching conversations:', error);
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
    const { participant_ids, session_id, type = 'direct' } = body;

    // Validate
    if (!participant_ids || participant_ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one participant is required' },
        { status: 400 }
      );
    }

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
        session_id,
        participants: {
          create: [
            { user_id: user.id },
            ...participant_ids.map((id: string) => ({ user_id: id })),
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
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
