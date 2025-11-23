'use client';

/**
 * Real-time Chat Component
 *
 * A complete chat interface with real-time messaging, typing indicators,
 * and optimistic updates.
 *
 * @example
 * ```tsx
 * <RealtimeChat
 *   conversationId="uuid"
 *   currentUser={{ id: "...", username: "...", avatar_url: "..." }}
 * />
 * ```
 */

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useRealtimeMessages, Message } from '@/lib/hooks/useRealtimeMessages';
import { useTypingIndicator } from '@/lib/hooks/useTypingIndicator';

// ============================================================================
// Types
// ============================================================================

interface User {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface RealtimeChatProps {
  conversationId: string;
  currentUser: User;
  className?: string;
}

// ============================================================================
// Sub-components
// ============================================================================

function MessageBubble({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) {
  const senderName =
    message.sender?.display_name || message.sender?.username || 'Unknown';
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[70%] ${
          isOwn
            ? 'bg-blue-500 text-white rounded-l-lg rounded-tr-lg'
            : 'bg-gray-100 text-gray-900 rounded-r-lg rounded-tl-lg'
        } px-4 py-2`}
      >
        {!isOwn && (
          <div className="text-xs font-medium text-gray-500 mb-1">
            {senderName}
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <div
          className={`text-xs mt-1 ${
            isOwn ? 'text-blue-100' : 'text-gray-400'
          }`}
        >
          {time}
        </div>
      </div>
    </div>
  );
}

function TypingIndicatorDisplay({ users }: { users: { username: string }[] }) {
  if (users.length === 0) return null;

  const names = users.map((u) => u.username).join(', ');
  const text = users.length === 1 ? `${names} is typing...` : `${names} are typing...`;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 px-4 py-2">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{text}</span>
    </div>
  );
}

function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  if (isConnected) return null;

  return (
    <div className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 text-center">
      Connecting...
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function RealtimeChat({
  conversationId,
  currentUser,
  className = '',
}: RealtimeChatProps) {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Real-time messages
  const { messages, sendMessage, isConnected, isLoading, error } =
    useRealtimeMessages(conversationId, {
      onNewMessage: () => {
        // Scroll to bottom on new message
        scrollToBottom();
      },
    });

  // Typing indicator
  const { typingUsers, setTyping } = useTypingIndicator(
    conversationId,
    currentUser.id,
    currentUser.display_name || currentUser.username || 'User'
  );

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  // Handle send
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const content = inputValue.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setInputValue('');
    setTyping(false);

    try {
      await sendMessage(content);
    } catch {
      // Error is handled by the hook
      setInputValue(content); // Restore on error
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Connection status */}
      <ConnectionStatus isConnected={isConnected} />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading messages...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500">
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === currentUser.id}
              />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      <TypingIndicatorDisplay users={typingUsers} />

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 p-4 flex gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Type a message..."
          disabled={!isConnected || isSending}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          maxLength={5000}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || !isConnected || isSending}
          className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSending ? (
            <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Send'
          )}
        </button>
      </form>
    </div>
  );
}

export default RealtimeChat;
