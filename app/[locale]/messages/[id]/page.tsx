'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import Button from '@/app/components/ui/Button';
import Loading from '@/app/components/ui/Loading';
import ErrorMessage from '@/app/components/ui/ErrorMessage';

const ChatBox = dynamic(() => import('@/app/components/chat/ChatBox'), {
  loading: () => <Loading text="Loading chat..." />,
});

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const conversationId = params.id as string;

  useEffect(() => {
    if (user && conversationId) {
      fetchConversation();
    }
  }, [user, conversationId]);

  const fetchConversation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (!response.ok) throw new Error('Failed to fetch conversation');
      const data = await response.json();
      setConversation(data);
      setError('');
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorMessage
            title="Please log in"
            message="You need to be logged in to view messages"
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Loading text="Loading conversation..." fullScreen />
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorMessage
            message={error || 'Conversation not found'}
            onRetry={fetchConversation}
          />
        </div>
      </div>
    );
  }

  const otherParticipants = conversation.participants.filter(
    (p: any) => p.user.id !== user.id
  );

  const displayName =
    conversation.type === 'session'
      ? `${conversation.session?.sport_type || 'Session'} Chat`
      : conversation.name ||
        otherParticipants
          .map((p: any) => p.user.username || p.user.email.split('@')[0])
          .join(', ') ||
        'Chat';

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/messages')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">{displayName}</h1>
            {conversation.type === 'session' && conversation.session && (
              <p className="text-sm text-gray-600">
                {conversation.session.sport_center?.name_en}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full bg-white">
        <ChatBox conversationId={conversationId} currentUserId={user.id} />
      </div>
    </div>
  );
}
