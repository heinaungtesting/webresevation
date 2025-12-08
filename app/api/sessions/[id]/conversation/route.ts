import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

// GET /api/sessions/[id]/conversation - Get or create conversation for a session
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is attending this session
    const userSession = await prisma.userSession.findUnique({
      where: {
        user_id_session_id: {
          user_id: user.id,
          session_id: sessionId,
        },
      },
    });

    if (!userSession) {
      return NextResponse.json(
        { error: 'You must be attending this session to access the chat' },
        { status: 403 }
      );
    }

    // Check if conversation already exists for this session
    let conversation = await prisma.conversation.findUnique({
      where: { session_id: sessionId },
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
        session: {
          select: {
            id: true,
            sport_type: true,
            date_time: true,
            sport_center: {
              select: {
                name_en: true,
              },
            },
          },
        },
      },
    });

    // If conversation doesn't exist, create it
    if (!conversation) {
      // Get all participants of the session
      const sessionParticipants = await prisma.userSession.findMany({
        where: { session_id: sessionId },
        select: { user_id: true },
      });

      conversation = await prisma.conversation.create({
        data: {
          type: 'session',
          session_id: sessionId,
          participants: {
            create: sessionParticipants.map((p) => ({
              user_id: p.user_id,
            })),
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
          session: {
            select: {
              id: true,
              sport_type: true,
              date_time: true,
              sport_center: {
                select: {
                  name_en: true,
                },
              },
            },
          },
        },
      });
    } else {
      // Conversation exists, make sure current user is a participant
      const isParticipant = conversation.participants.some(
        (p) => p.user_id === user.id
      );

      if (!isParticipant) {
        // Add user as participant
        await prisma.conversationParticipant.create({
          data: {
            conversation_id: conversation.id,
            user_id: user.id,
          },
        });

        // Refresh conversation data
        conversation = await prisma.conversation.findUnique({
          where: { id: conversation.id },
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
            session: {
              select: {
                id: true,
                sport_type: true,
                date_time: true,
                sport_center: {
                  select: {
                    name_en: true,
                  },
                },
              },
            },
          },
        });
      }
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error getting/creating session conversation:', error);
    return NextResponse.json(
      { error: 'Failed to get conversation' },
      { status: 500 }
    );
  }
}
