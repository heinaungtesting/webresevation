'use client';

/**
 * Real-time Notifications Hook
 *
 * Subscribes to new notifications for the current user.
 * Supports browser notifications and audio alerts.
 *
 * @example
 * ```tsx
 * const { notifications, unreadCount, markAsRead } = useRealtimeNotifications(userId);
 * ```
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface UseRealtimeNotificationsOptions {
  /** Enable browser notifications */
  enableBrowserNotifications?: boolean;
  /** Enable sound alerts */
  enableSound?: boolean;
  /** Callback when new notification arrives */
  onNotification?: (notification: Notification) => void;
}

export interface UseRealtimeNotificationsReturn {
  /** List of notifications */
  notifications: Notification[];
  /** Number of unread notifications */
  unreadCount: number;
  /** Mark a notification as read */
  markAsRead: (notificationId: string) => Promise<void>;
  /** Mark all notifications as read */
  markAllAsRead: () => Promise<void>;
  /** Connection status */
  isConnected: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Refresh notifications */
  refresh: () => Promise<void>;
}

// ============================================================================
// Browser Notification Permission
// ============================================================================

async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;

  if (Notification.permission === 'granted') return true;

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

function showBrowserNotification(notification: Notification): void {
  if (Notification.permission !== 'granted') return;

  const browserNotification = new Notification(notification.title, {
    body: notification.message,
    icon: '/icon-192x192.png',
    tag: notification.id,
  });

  if (notification.link) {
    browserNotification.onclick = () => {
      window.focus();
      window.location.href = notification.link!;
    };
  }
}

// ============================================================================
// Sound Alert
// ============================================================================

let notificationSound: HTMLAudioElement | null = null;

function playNotificationSound(): void {
  if (typeof window === 'undefined') return;

  if (!notificationSound) {
    notificationSound = new Audio('/sounds/notification.mp3');
    notificationSound.volume = 0.5;
  }

  notificationSound.play().catch(() => {
    // Autoplay blocked, ignore
  });
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useRealtimeNotifications(
  userId: string | null,
  options: UseRealtimeNotificationsOptions = {}
): UseRealtimeNotificationsReturn {
  const {
    enableBrowserNotifications = true,
    enableSound = true,
    onNotification,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Request browser notification permission
  useEffect(() => {
    if (enableBrowserNotifications) {
      requestNotificationPermission();
    }
  }, [enableBrowserNotifications]);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/users/me/notifications?limit=50');
      if (!response.ok) throw new Error('Failed to fetch notifications');

      const data = await response.json();
      setNotifications(data.notifications || data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!userId) return;

    const supabase = supabaseRef.current;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Notification',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;

          // Add to list
          setNotifications((prev) => [newNotification, ...prev]);

          // Show browser notification
          if (enableBrowserNotifications) {
            showBrowserNotification(newNotification);
          }

          // Play sound
          if (enableSound) {
            playNotificationSound();
          }

          // Callback
          onNotification?.(newNotification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Notification',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    // Fetch initial notifications
    fetchNotifications();

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [userId, enableBrowserNotifications, enableSound, onNotification, fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/users/me/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, read: true }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/users/me/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isConnected,
    isLoading,
    refresh: fetchNotifications,
  };
}

export default useRealtimeNotifications;
