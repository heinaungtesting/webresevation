'use client';

/**
 * Authenticated Socket.io Messages Hook
 *
 * Integrates Supabase Auth with Socket.io for secure real-time messaging.
 * Only works when user is authenticated via Supabase.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { socketManager } from '@/lib/socket/client';
import { createClient } from '@/lib/supabase/client';
import type { Message, UseRealtimeMessagesOptions, UseRealtimeMessagesReturn } from './useSocketMessages';

export function useAuthenticatedSocketMessages(
  conversationId: string | null,
  options: UseRealtimeMessagesOptions = {}
): UseRealtimeMessagesReturn {
  const { initialMessages = [], onNewMessage, onConnectionChange } = options;

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const currentConversationRef = useRef<string | null>(null);
  const supabase = createClient();

  // Get authenticated user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setError('User not authenticated');
        setIsLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        setError('User not authenticated');
        setIsConnected(false);
        onConnectionChange?.(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, onConnectionChange]);

  // Fetch initial messages (with auth)
  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No valid session');
      }

      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const data = await response.json();
      setMessages(Array.isArray(data) ? data : data.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, user, supabase]);

  // Socket event handlers
  const handleNewMessage = useCallback((message: Message) => {
    console.log('📨 New message received via Socket.io:', message);

    setMessages(prev => {
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

  // Setup Socket.io connection with auth
  useEffect(() => {
    if (!conversationId || !user) {
      setMessages([]);
      setIsConnected(false);
      setIsLoading(false);
      return;
    }

    const connectWithAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setError('No valid session for Socket.io connection');
          return;
        }

        // Connect to Socket.io with user info
        const socket = socketManager.connect(user.id, user.email || user.user_metadata?.name || 'User');

        // Set up connection tracking
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
            console.log('✅ Authenticated Socket connected for messages');
            handleConnectionChange(true);
            if (currentConversationRef.current) {
              socketManager.joinConversation(currentConversationRef.current);
            }
          });

          socketInstance.on('disconnect', () => {
            console.log('🔌 Authenticated Socket disconnected for messages');
            handleConnectionChange(false);
          });
        }

        // Fetch initial messages
        await fetchMessages();

        // Cleanup function
        return () => {
          clearInterval(connectionInterval);
          if (currentConversationRef.current) {
            socketManager.leaveConversation(currentConversationRef.current);
          }
          socketManager.off('new-message', handleNewMessage);
          socketManager.off('message-updated', handleMessageUpdated);
          socketManager.off('message-deleted', handleMessageDeleted);
          currentConversationRef.current = null;
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to setup authenticated connection');
        console.error('Auth Socket setup error:', err);
      }
    };

    connectWithAuth();
  }, [conversationId, user, supabase, fetchMessages, handleNewMessage, handleMessageUpdated, handleMessageDeleted, handleConnectionChange]);

  // Send message (with auth)
  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !content.trim() || !user) return;

      setError(null);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No valid session for sending message');
        }

        const response = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content: content.trim() }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || `Failed to send message: ${response.status}`);
        }

        const messageData = await response.json();

        // Broadcast the message via Socket.io to other users
        const socket = socketManager.getSocket();
        if (socket) {
          socket.emit('broadcast-message', {
            conversationId,
            message: messageData
          });
        }

        // Add to local state immediately for optimistic updates
        setMessages(prev => {
          const exists = prev.some(m => m.id === messageData.id);
          if (exists) return prev;
          return [...prev, messageData];
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        throw err;
      }
    },
    [conversationId, user, supabase]
  );

  // Manual refresh
  const refresh = useCallback(async () => {
    if (user) {
      await fetchMessages();
    }
  }, [fetchMessages, user]);

  return {
    messages,
    sendMessage,
    isConnected,
    isLoading,
    error,
    refresh,
  };
}

export default useAuthenticatedSocketMessages;