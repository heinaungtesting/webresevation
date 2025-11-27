/**
 * Supabase Realtime Client Utilities
 * 
 * React hooks and utilities for real-time features using Supabase Realtime
 * Works perfectly on Vercel and everywhere else!
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * React hook for subscribing to new messages in a conversation
 */
export function useConversationMessages(
    conversationId: string,
    onNewMessage: (message: any) => void
) {
    const channelRef = useRef<RealtimeChannel | null>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!conversationId) return;

        console.log(`📡 Subscribing to conversation messages: ${conversationId}`);

        // Create channel
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
                (payload) => {
                    console.log('📨 New message received:', payload.new);
                    onNewMessage(payload.new);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Subscribed to conversation messages');
                }
            });

        channelRef.current = channel;

        // Cleanup
        return () => {
            console.log(`📡 Unsubscribing from conversation: ${conversationId}`);
            supabase.removeChannel(channel);
        };
    }, [conversationId, onNewMessage, supabase]);

    return channelRef.current;
}

/**
 * React hook for typing indicators
 */
export function useTypingIndicator(
    conversationId: string,
    currentUserId: string,
    onUserTyping: (data: { userId: string; username: string; isTyping: boolean }) => void
) {
    const channelRef = useRef<RealtimeChannel | null>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!conversationId) return;

        console.log(`⌨️  Setting up typing indicators for: ${conversationId}`);

        // Create channel with presence
        const channel = supabase
            .channel(`typing:${conversationId}`)
            .on('broadcast', { event: 'typing' }, (payload) => {
                // Ignore own typing events
                if (payload.payload.userId !== currentUserId) {
                    console.log('⌨️  User typing:', payload.payload);
                    onUserTyping(payload.payload);
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Subscribed to typing indicators');
                }
            });

        channelRef.current = channel;

        // Cleanup
        return () => {
            console.log(`⌨️  Unsubscribing from typing indicators: ${conversationId}`);
            supabase.removeChannel(channel);
        };
    }, [conversationId, currentUserId, onUserTyping, supabase]);

    // Function to send typing indicator
    const sendTyping = useCallback(
        (userId: string, username: string, isTyping: boolean) => {
            if (channelRef.current) {
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'typing',
                    payload: { userId, username, isTyping },
                });
            }
        },
        []
    );

    return { channel: channelRef.current, sendTyping };
}

/**
 * React hook for user notifications
 */
export function useUserNotifications(
    userId: string,
    onNotification: (notification: any) => void
) {
    const channelRef = useRef<RealtimeChannel | null>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!userId) return;

        console.log(`🔔 Subscribing to notifications for user: ${userId}`);

        // Create channel
        const channel = supabase
            .channel(`user:${userId}:notifications`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'Notification',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('🔔 New notification:', payload.new);
                    onNotification(payload.new);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Subscribed to user notifications');
                }
            });

        channelRef.current = channel;

        // Cleanup
        return () => {
            console.log(`🔔 Unsubscribing from notifications: ${userId}`);
            supabase.removeChannel(channel);
        };
    }, [userId, onNotification, supabase]);

    return channelRef.current;
}

/**
 * React hook for presence (online/offline status)
 */
export function usePresence(
    channelName: string,
    userId: string,
    username: string,
    onPresenceChange: (presences: any[]) => void
) {
    const channelRef = useRef<RealtimeChannel | null>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!channelName || !userId) return;

        console.log(`👥 Setting up presence for: ${channelName}`);

        // Create channel with presence
        const channel = supabase
            .channel(channelName, {
                config: {
                    presence: {
                        key: userId,
                    },
                },
            })
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const presences = Object.values(state).flat();
                console.log('👥 Presence synced:', presences);
                onPresenceChange(presences);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('👋 User joined:', key, newPresences);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('👋 User left:', key, leftPresences);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Subscribed to presence');
                    // Track own presence
                    await channel.track({
                        userId,
                        username,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        channelRef.current = channel;

        // Cleanup
        return () => {
            console.log(`👥 Unsubscribing from presence: ${channelName}`);
            if (channelRef.current) {
                channelRef.current.untrack();
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [channelName, userId, username, onPresenceChange, supabase]);

    return channelRef.current;
}

/**
 * React hook for session updates (attendance changes)
 */
export function useSessionUpdates(
    sessionId: string,
    onSessionUpdate: (update: any) => void
) {
    const channelRef = useRef<RealtimeChannel | null>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!sessionId) return;

        console.log(`📅 Subscribing to session updates: ${sessionId}`);

        // Create channel
        const channel = supabase
            .channel(`session:${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'UserSession',
                    filter: `session_id=eq.${sessionId}`,
                },
                (payload) => {
                    console.log('📅 Session update:', payload);
                    onSessionUpdate(payload);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Subscribed to session updates');
                }
            });

        channelRef.current = channel;

        // Cleanup
        return () => {
            console.log(`📅 Unsubscribing from session: ${sessionId}`);
            supabase.removeChannel(channel);
        };
    }, [sessionId, onSessionUpdate, supabase]);

    return channelRef.current;
}

/**
 * Generic hook for custom Supabase Realtime subscriptions
 */
export function useRealtimeSubscription(
    channelName: string,
    config: {
        table: string;
        event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
        filter?: string;
        onData: (payload: any) => void;
    }
) {
    const channelRef = useRef<RealtimeChannel | null>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!channelName) return;

        console.log(`📡 Setting up realtime subscription: ${channelName}`);

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: config.event || '*',
                    schema: 'public',
                    table: config.table,
                    filter: config.filter,
                } as any,
                (payload: RealtimePostgresChangesPayload<any>) => {
                    console.log(`📡 Realtime data from ${config.table}:`, payload);
                    config.onData(payload);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`✅ Subscribed to ${channelName}`);
                }
            });

        channelRef.current = channel;

        return () => {
            console.log(`📡 Unsubscribing from: ${channelName}`);
            supabase.removeChannel(channel);
        };
    }, [channelName, config, supabase]);

    return channelRef.current;
}

export default {
    useConversationMessages,
    useTypingIndicator,
    useUserNotifications,
    usePresence,
    useSessionUpdates,
    useRealtimeSubscription,
};
