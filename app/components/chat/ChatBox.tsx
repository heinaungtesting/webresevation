'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import MessageBubble from './MessageBubble';
import Loading from '../ui/Loading';
import ErrorMessage from '../ui/ErrorMessage';
import EmptyState from '../ui/EmptyState';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender: {
    id: string;
    email: string;
    username?: string | null;
  };
}

interface ChatBoxProps {
  conversationId: string;
  currentUserId: string;
}

export default function ChatBox({ conversationId, currentUserId }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data);
      setError('');

      // Mark as read
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'PUT',
      });
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Initial fetch and Supabase Realtime subscription
  useEffect(() => {
    fetchMessages();

    // Setup Supabase Realtime subscription for new messages
    const supabase = createClient();

    // Subscribe to INSERT events on the Message table for this conversation
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info since realtime only gives us the raw row
          const newMsg = payload.new as any;

          // Only process if it's not our own message (we add those optimistically)
          if (newMsg.sender_id !== currentUserId) {
            try {
              // Fetch sender details
              const response = await fetch(`/api/users/${newMsg.sender_id}`);
              let sender = { id: newMsg.sender_id, email: 'Unknown', username: null };

              if (response.ok) {
                const userData = await response.json();
                sender = {
                  id: userData.id,
                  email: userData.email,
                  username: userData.username,
                };
              }

              const messageWithSender: Message = {
                id: newMsg.id,
                content: newMsg.content,
                sender_id: newMsg.sender_id,
                created_at: newMsg.created_at,
                sender,
              };

              setMessages((prev) => {
                // Avoid duplicates
                if (prev.some((m) => m.id === messageWithSender.id)) {
                  return prev;
                }
                return [...prev, messageWithSender];
              });
            } catch (err) {
              console.error('Error processing realtime message:', err);
              // Fallback: refetch all messages
              fetchMessages();
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to messages for conversation ${conversationId}`);
        }
      });

    channelRef.current = channel;

    // Cleanup subscription on unmount or conversation change
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [conversationId, currentUserId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: messageContent }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const sentMessage = await response.json();

      // Add the sent message to the list (optimistic update)
      setMessages((prev) => {
        // Avoid duplicates in case realtime already added it
        if (prev.some((m) => m.id === sentMessage.id)) {
          return prev;
        }
        return [...prev, sentMessage];
      });

      setError('');
      inputRef.current?.focus();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      setNewMessage(messageContent); // Restore message
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  if (loading) {
    return <Loading text="Loading messages..." />;
  }

  if (error && messages.length === 0) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchMessages}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {messages.length === 0 ? (
          <EmptyState
            icon={<Send className="w-8 h-8" />}
            title="No messages yet"
            description="Start the conversation by sending a message"
          />
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                content={message.content}
                sender={message.sender}
                created_at={message.created_at}
                isOwn={message.sender_id === currentUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white">
        {error && (
          <div className="text-sm text-red-600 mb-2">{error}</div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-[44px]"
            disabled={sending}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!newMessage.trim() || sending}
            className="px-4"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
