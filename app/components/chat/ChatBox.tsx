'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import Button from '../ui/Button';
import MessageBubble from './MessageBubble';
import Loading from '../ui/Loading';
import ErrorMessage from '../ui/ErrorMessage';
import EmptyState from '../ui/EmptyState';
import { useConversationMessages } from '@/lib/realtime/client';
import { csrfPost, csrfPut } from '@/lib/csrfClient';

interface ChatBoxProps {
  conversationId: string;
  currentUserId: string;
}

export default function ChatBox({ conversationId, currentUserId }: ChatBoxProps) {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/conversations/${conversationId}/messages`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(data.messages || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId]);

  // Subscribe to new messages with Supabase Realtime
  // Debounce rapid updates to prevent excessive re-renders
  const handleNewMessage = useCallback((message: any) => {
    setMessages(prev => [...prev, message]);

    // Mark conversation as read when new message arrives
    if (message.sender_id !== currentUserId) {
      csrfPut(`/api/conversations/${conversationId}/read`, {}).catch(console.error);
    }
    scrollToBottom();
  }, [conversationId, currentUserId]);

  const debouncedHandleNewMessage = useDebouncedCallback(handleNewMessage, 100);

  useConversationMessages(conversationId, debouncedHandleNewMessage);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when messages change
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
      // Send message via API
      await csrfPost(`/api/conversations/${conversationId}/messages`, {
        content: messageContent,
      });

      inputRef.current?.focus();
    } catch (err) {
      console.error('Error sending message:', err);
      setNewMessage(messageContent); // Restore message on error
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
                sender={message.sender || { id: message.sender_id, email: 'Unknown', username: null }}
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
