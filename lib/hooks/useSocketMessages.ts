'use client';

/**
 * Socket.io Messages Hook
 *
 * Replaces useRealtimeMessages with Socket.io implementation.
 * Provides the same interface but uses Socket.io instead of Supabase Realtime.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { socketManager } from '@/lib/socket/client';

// Message interface
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  sender?: {
    id: string;
    email: string;
    username?: string | null;
  };
}

// Hook options interface
export interface UseRealtimeMessagesOptions {
  initialMessages?: Message[];
  onNewMessage?: (message: Message) => void;
  onConnectionChange?: (connected: boolean) => void;
}

// Hook return interface
export interface UseRealtimeMessagesReturn {
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSocketMessages(
  conversationId: string | null,
  options: UseRealtimeMessagesOptions = {}
): UseRealtimeMessagesReturn {
  const { initialMessages = [], onNewMessage, onConnectionChange } = options;

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentConversationRef = useRef<string | null>(null);

  // Fetch initial messages from API
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

  // Socket event handlers
  const handleNewMessage = useCallback((message: Message) => {
    console.log('📨 New message received via Socket.io:', message);

    setMessages(prev => {
      // Avoid duplicates
      const exists = prev.some(m => m.id === message.id);
      if (exists) return prev;
      return [...prev, message];
    });

    onNewMessage?.(message);
  }, [onNewMessage]);

  const handleMessageUpdated = useCallback((message: Message) => {
    console.log('✏️ Message updated via Socket.io:', message);

    setMessages(prev =>
      prev.map(m => m.id === message.id ? message : m)
    );
  }, []);

  const handleMessageDeleted = useCallback((messageId: string) => {
    console.log('🗑️ Message deleted via Socket.io:', messageId);

    setMessages(prev => prev.filter(m => m.id !== messageId));
  }, []);

  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
    onConnectionChange?.(connected);
  }, [onConnectionChange]);

  // Setup Socket.io connection and events
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setIsConnected(false);
      setIsLoading(false);
      return;
    }

    const socket = socketManager.getSocket();

    if (!socket) {
      console.log('🔌 Connecting to Socket.io...');
      socketManager.connect();
    }

    // Track connection status
    const checkConnection = () => {
      const connected = socketManager.isConnected();
      if (connected !== isConnected) {
        handleConnectionChange(connected);
      }
    };

    const connectionInterval = setInterval(checkConnection, 1000);

    // Join conversation room
    socketManager.joinConversation(conversationId);
    currentConversationRef.current = conversationId;

    // Listen for Socket.io events
    socketManager.on('new-message', handleNewMessage);
    socketManager.on('message-updated', handleMessageUpdated);
    socketManager.on('message-deleted', handleMessageDeleted);

    // Socket connection events
    const socketInstance = socketManager.getSocket();
    if (socketInstance) {
      socketInstance.on('connect', () => {
        console.log('✅ Socket connected for messages');
        handleConnectionChange(true);
        // Rejoin conversation after reconnection
        if (currentConversationRef.current) {
          socketManager.joinConversation(currentConversationRef.current);
        }
      });

      socketInstance.on('disconnect', () => {
        console.log('🔌 Socket disconnected for messages');
        handleConnectionChange(false);
      });
    }

    // Fetch initial messages
    fetchMessages();

    // Cleanup
    return () => {
      clearInterval(connectionInterval);

      // Leave conversation
      if (currentConversationRef.current) {
        socketManager.leaveConversation(currentConversationRef.current);
      }

      // Remove event listeners
      socketManager.off('new-message', handleNewMessage);
      socketManager.off('message-updated', handleMessageUpdated);
      socketManager.off('message-deleted', handleMessageDeleted);

      currentConversationRef.current = null;
    };
  }, [conversationId, fetchMessages, handleNewMessage, handleMessageUpdated, handleMessageDeleted, handleConnectionChange]);

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

        const messageData = await response.json();

        // Broadcast the message via Socket.io to other users
        const socket = socketManager.getSocket();
        if (socket) {
          socket.emit('broadcast-message', {
            conversationId,
            message: messageData.message
          });
        }

        // Add to local state immediately for optimistic updates
        setMessages(prev => {
          const exists = prev.some(m => m.id === messageData.message.id);
          if (exists) return prev;
          return [...prev, messageData.message];
        });

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

export default useSocketMessages;