'use client';

/**
 * Typing Indicator Hook
 *
 * Uses Supabase Realtime Broadcast to show when users are typing.
 * Automatically handles debouncing and cleanup.
 *
 * @example
 * ```tsx
 * const { typingUsers, setTyping } = useTypingIndicator(conversationId, currentUserId);
 *
 * // In input onChange
 * setTyping(true);
 *
 * // Display
 * {typingUsers.length > 0 && <span>{typingUsers[0].name} is typing...</span>}
 * ```
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export interface TypingUser {
  userId: string;
  username: string;
  startedAt: number;
}

export interface UseTypingIndicatorReturn {
  /** Users currently typing */
  typingUsers: TypingUser[];
  /** Set current user's typing status */
  setTyping: (isTyping: boolean) => void;
  /** Check if a specific user is typing */
  isUserTyping: (userId: string) => boolean;
}

// ============================================================================
// Constants
// ============================================================================

const TYPING_TIMEOUT = 3000; // 3 seconds until typing indicator disappears
const TYPING_THROTTLE = 1000; // Throttle typing broadcasts to 1 per second

// ============================================================================
// Hook Implementation
// ============================================================================

export function useTypingIndicator(
  conversationId: string | null,
  currentUserId: string | null,
  currentUsername: string = 'Someone'
): UseTypingIndicatorReturn {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastTypingBroadcast = useRef<number>(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Subscribe to typing events
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, username, isTyping } = payload.payload as {
          userId: string;
          username: string;
          isTyping: boolean;
        };

        // Ignore own typing events
        if (userId === currentUserId) return;

        setTypingUsers((prev) => {
          if (isTyping) {
            // Add or update typing user
            const existing = prev.find((u) => u.userId === userId);
            if (existing) {
              return prev.map((u) =>
                u.userId === userId ? { ...u, startedAt: Date.now() } : u
              );
            }
            return [...prev, { userId, username, startedAt: Date.now() }];
          } else {
            // Remove typing user
            return prev.filter((u) => u.userId !== userId);
          }
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [conversationId, currentUserId]);

  // Broadcast typing status
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current || !currentUserId) return;

      const now = Date.now();

      // Throttle typing broadcasts
      if (isTyping && now - lastTypingBroadcast.current < TYPING_THROTTLE) {
        return;
      }

      lastTypingBroadcast.current = now;

      // Broadcast typing event
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: currentUserId,
          username: currentUsername,
          isTyping,
        },
      });

      // Auto-stop typing after timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          channelRef.current?.send({
            type: 'broadcast',
            event: 'typing',
            payload: {
              userId: currentUserId,
              username: currentUsername,
              isTyping: false,
            },
          });
        }, TYPING_TIMEOUT);
      }
    },
    [currentUserId, currentUsername]
  );

  // Check if specific user is typing
  const isUserTyping = useCallback(
    (userId: string) => typingUsers.some((u) => u.userId === userId),
    [typingUsers]
  );

  return {
    typingUsers,
    setTyping,
    isUserTyping,
  };
}

export default useTypingIndicator;
