'use client';

/**
 * Socket.io Typing Indicator Hook
 *
 * Replaces useTypingIndicator with Socket.io implementation.
 * Provides the same interface but uses Socket.io instead of Supabase Realtime.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { socketManager } from '@/lib/socket/client';

// Typing user interface
export interface TypingUser {
  userId: string;
  username: string;
  startedAt: number;
}

// Hook return interface
export interface UseTypingIndicatorReturn {
  typingUsers: TypingUser[];
  startTyping: () => void;
  stopTyping: () => void;
  isConnected: boolean;
}

// Constants (same as original)
const TYPING_TIMEOUT = 3000; // 3 seconds until typing indicator disappears
const TYPING_THROTTLE = 1000; // Throttle typing broadcasts to 1 per second

export function useSocketTypingIndicator(
  conversationId: string | null,
  currentUserId: string | null,
  currentUsername: string = 'Someone'
): UseTypingIndicatorReturn {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const lastTypingBroadcast = useRef<number>(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentConversationRef = useRef<string | null>(null);

  // Clean up stale typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) =>
        prev.filter((user) => now - user.startedAt < TYPING_TIMEOUT)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle typing events from Socket.io
  const handleUserTyping = useCallback((data: { userId: string; username: string; isTyping: boolean }) => {
    // Ignore own typing events
    if (data.userId === currentUserId) return;

    console.log(`⌨️ Typing event via Socket.io: ${data.username} is ${data.isTyping ? 'typing' : 'stopped typing'}`);

    setTypingUsers((prev) => {
      if (data.isTyping) {
        // Add or update typing user
        const existing = prev.find((u) => u.userId === data.userId);
        if (existing) {
          return prev.map((u) =>
            u.userId === data.userId ? { ...u, startedAt: Date.now() } : u
          );
        }
        return [...prev, {
          userId: data.userId,
          username: data.username,
          startedAt: Date.now()
        }];
      } else {
        // Remove typing user
        return prev.filter((u) => u.userId !== data.userId);
      }
    });
  }, [currentUserId]);

  // Setup Socket.io events for typing
  useEffect(() => {
    if (!conversationId || !currentUserId) {
      setTypingUsers([]);
      return;
    }

    const socket = socketManager.getSocket();

    if (!socket) {
      console.log('🔌 Connecting to Socket.io for typing indicators...');
      socketManager.connect();
    }

    currentConversationRef.current = conversationId;

    // Listen for typing events
    socketManager.on('user-typing', handleUserTyping);

    // Handle reconnection
    const socketInstance = socketManager.getSocket();
    if (socketInstance) {
      socketInstance.on('connect', () => {
        console.log('✅ Socket connected for typing indicators');
        // Rejoin conversation after reconnection
        if (currentConversationRef.current) {
          socketManager.joinConversation(currentConversationRef.current);
        }
      });
    }

    return () => {
      // Remove event listeners
      socketManager.off('user-typing', handleUserTyping);
      currentConversationRef.current = null;
    };
  }, [conversationId, currentUserId, handleUserTyping]);

  // Broadcast typing status
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!conversationId || !currentUserId || !currentUsername) return;

      const socket = socketManager.getSocket();
      if (!socket || !socket.connected) return;

      const now = Date.now();

      // Throttle typing broadcasts
      if (isTyping && now - lastTypingBroadcast.current < TYPING_THROTTLE) {
        return;
      }

      lastTypingBroadcast.current = now;

      // Send typing event via Socket.io
      socketManager.sendTyping(conversationId, currentUserId, currentUsername, isTyping);

      console.log(`⌨️ Sent typing indicator: ${isTyping ? 'started' : 'stopped'} typing`);

      // Auto-stop typing after timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          socketManager.sendTyping(conversationId, currentUserId, currentUsername, false);
        }, TYPING_TIMEOUT);
      }
    },
    [conversationId, currentUserId, currentUsername]
  );

  // Check if specific user is typing
  const isUserTyping = useCallback(
    (userId: string) => typingUsers.some((u) => u.userId === userId),
    [typingUsers]
  );

  // Track connection status
  useEffect(() => {
    const checkConnection = () => {
      const connected = socketManager.isConnected();
      setIsConnected(connected);
    };

    const interval = setInterval(checkConnection, 1000);
    checkConnection(); // Initial check

    return () => clearInterval(interval);
  }, []);

  // Wrapper functions for the interface
  const startTyping = useCallback(() => setTyping(true), [setTyping]);
  const stopTyping = useCallback(() => setTyping(false), [setTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    typingUsers,
    startTyping,
    stopTyping,
    isConnected,
  };
}

export default useSocketTypingIndicator;