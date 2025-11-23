'use client';

/**
 * Real-time Messages Hook
 *
 * Uses Supabase Realtime to subscribe to new messages in a conversation.
 * Provides automatic reconnection and optimistic updates.
 *
 * @example
 * ```tsx
 * const { messages, sendMessage, isConnected } = useRealtimeMessages(conversationId);
 * ```
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface UseRealtimeMessagesOptions {
  /** Initial messages to display */
  initialMessages?: Message[];
  /** Callback when a new message arrives */
  onNewMessage?: (message: Message) => void;
  /** Callback when connection status changes */
  onConnectionChange?: (connected: boolean) => void;
}

export interface UseRealtimeMessagesReturn {
  /** List of messages */
  messages: Message[];
  /** Send a new message */
  sendMessage: (content: string) => Promise<void>;
  /** Connection status */
  isConnected: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Manually refresh messages */
  refresh: () => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useRealtimeMessages(
  conversationId: string | null,
  options: UseRealtimeMessagesOptions = {}
): UseRealtimeMessagesReturn {
  const { initialMessages = [], onNewMessage, onConnectionChange } = options;

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');

      const data = await response.json();
      setMessages(data.messages || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!conversationId) return;

    const supabase = supabaseRef.current;

    // Create channel for this conversation
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;

          // Fetch sender details
          const { data: sender } = await supabase
            .from('User')
            .select('id, username, display_name, avatar_url')
            .eq('id', newMessage.sender_id)
            .single();

          const messageWithSender = {
            ...newMessage,
            sender: sender || undefined,
          };

          // Add to messages (avoid duplicates)
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMessage.id);
            if (exists) return prev;
            return [...prev, messageWithSender];
          });

          // Callback
          onNewMessage?.(messageWithSender);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'Message',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .subscribe((status) => {
        const connected = status === 'SUBSCRIBED';
        setIsConnected(connected);
        onConnectionChange?.(connected);

        if (status === 'CHANNEL_ERROR') {
          setError('Connection error. Retrying...');
        }
      });

    channelRef.current = channel;

    // Fetch initial messages
    fetchMessages();

    // Cleanup
    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [conversationId, fetchMessages, onNewMessage, onConnectionChange]);

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !content.trim()) return;

      setError(null);

      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content.trim() }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to send message');
        }

        // Message will be added via real-time subscription
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        throw err;
      }
    },
    [conversationId]
  );

  // Manual refresh
  const refresh = useCallback(async () => {
    await fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    sendMessage,
    isConnected,
    isLoading,
    error,
    refresh,
  };
}

export default useRealtimeMessages;
