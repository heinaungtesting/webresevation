import Link from 'next/link';
import { formatDate, formatTime } from '@/lib/utils';
import { MessageCircle, Users } from 'lucide-react';
import Badge from '../ui/Badge';

interface ConversationCardProps {
  conversation: {
    id: string;
    type: string;
    name?: string | null;
    last_message_at?: string | null;
    unread_count?: number;
    participants: Array<{
      user: {
        id: string;
        email: string;
        username?: string | null;
      };
    }>;
    messages: Array<{
      content: string;
      sender: {
        id: string;
        email: string;
        username?: string | null;
      };
      created_at: string;
    }>;
    session?: {
      id: string;
      sport_type: string;
      date_time: string;
    } | null;
  };
  currentUserId: string;
}

export default function ConversationCard({
  conversation,
  currentUserId,
}: ConversationCardProps) {
  const otherParticipants = conversation.participants.filter(
    (p) => p.user.id !== currentUserId
  );

  const displayName =
    conversation.type === 'session'
      ? `${conversation.session?.sport_type || 'Session'} Chat`
      : conversation.name ||
        otherParticipants.map((p) => p.user.username || p.user.email.split('@')[0]).join(', ') ||
        'Chat';

  const lastMessage = conversation.messages[0];
  const hasUnread = (conversation.unread_count || 0) > 0;

  return (
    <Link href={`/messages/${conversation.id}`}>
      <div
        className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all duration-200 active:scale-[0.98] ${
          hasUnread ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3 flex-1">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full ${
                conversation.type === 'session' ? 'bg-blue-100' : 'bg-gray-100'
              }`}
            >
              {conversation.type === 'session' ? (
                <Users className="w-6 h-6 text-blue-600" />
              ) : (
                <MessageCircle className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-base truncate ${hasUnread ? 'text-blue-900' : 'text-gray-900'}`}>
                {displayName}
              </h3>
              {conversation.type === 'session' && conversation.session && (
                <p className="text-xs text-gray-500">
                  {formatDate(conversation.session.date_time)}
                </p>
              )}
            </div>
          </div>
          {hasUnread && (
            <Badge variant="info" size="sm">
              {conversation.unread_count}
            </Badge>
          )}
        </div>

        {lastMessage && (
          <div className="ml-15">
            <p className={`text-sm truncate ${hasUnread ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
              {lastMessage.sender.id === currentUserId ? 'You: ' : ''}
              {lastMessage.content}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatTime(lastMessage.created_at)}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
