'use client';

/**
 * Socket.io Notifications Hook
 *
 * Replaces useRealtimeNotifications with Socket.io implementation.
 * Provides the same interface but uses Socket.io instead of Supabase Realtime.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { socketManager } from '@/lib/socket/client';

// Notification interface
export interface Notification {
  id: string;
  user_id: string;
  type: 'message' | 'session_reminder' | 'session_update' | 'session_cancelled';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, any>;
  link?: string;
}

// Hook options interface
export interface UseRealtimeNotificationsOptions {
  userId?: string | null;
  enableBrowserNotifications?: boolean;
  enableSounds?: boolean;
  enableSound?: boolean; // Legacy alias for enableSounds
  onNewNotification?: (notification: Notification) => void;
  onNotification?: (notification: Notification) => void; // Legacy alias
  onConnectionChange?: (connected: boolean) => void;
}

// Hook return interface
export interface UseRealtimeNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Browser notification helpers (same as original)
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

// Sound alert (same as original)
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

export function useSocketNotifications(
  options: UseRealtimeNotificationsOptions = {}
): UseRealtimeNotificationsReturn {
  const {
    userId,
    enableBrowserNotifications = true,
    enableSounds = true,
    enableSound = true, // Legacy alias
    onNewNotification,
    onNotification, // Legacy alias
    onConnectionChange,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUserIdRef = useRef<string | null>(null);

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

  // Socket event handlers
  const handleNewNotification = useCallback((notification: Notification) => {
    console.log('🔔 New notification received via Socket.io:', notification);

    // Add to list
    setNotifications((prev) => [notification, ...prev]);

    // Show browser notification
    if (enableBrowserNotifications) {
      showBrowserNotification(notification);
    }

    // Play sound
    if (enableSound) {
      playNotificationSound();
    }

    // Callback
    onNotification?.(notification);
  }, [enableBrowserNotifications, enableSound, onNotification]);

  const handleNotificationUpdated = useCallback((notification: Notification) => {
    console.log('✏️ Notification updated via Socket.io:', notification);

    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? notification : n))
    );
  }, []);

  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
  }, []);

  // Setup Socket.io connection and events
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setIsConnected(false);
      setIsLoading(false);
      return;
    }

    const socket = socketManager.getSocket();

    if (!socket) {
      console.log('🔌 Connecting to Socket.io for notifications...');
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

    // Join user notifications room
    socketManager.joinNotifications(userId);
    currentUserIdRef.current = userId;

    // Listen for Socket.io events
    socketManager.on('new-notification', handleNewNotification);
    socketManager.on('notification-updated', handleNotificationUpdated);

    // Socket connection events
    const socketInstance = socketManager.getSocket();
    if (socketInstance) {
      socketInstance.on('connect', () => {
        console.log('✅ Socket connected for notifications');
        handleConnectionChange(true);
        // Rejoin notifications after reconnection
        if (currentUserIdRef.current) {
          socketManager.joinNotifications(currentUserIdRef.current);
        }
      });

      socketInstance.on('disconnect', () => {
        console.log('🔌 Socket disconnected for notifications');
        handleConnectionChange(false);
      });
    }

    // Fetch initial notifications
    fetchNotifications();

    // Cleanup
    return () => {
      clearInterval(connectionInterval);

      // Leave notifications
      if (currentUserIdRef.current) {
        socketManager.leaveNotifications(currentUserIdRef.current);
      }

      // Remove event listeners
      socketManager.off('new-notification', handleNewNotification);
      socketManager.off('notification-updated', handleNotificationUpdated);

      currentUserIdRef.current = null;
    };
  }, [userId, fetchNotifications, handleNewNotification, handleNotificationUpdated, handleConnectionChange]);

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

        // Broadcast the update via Socket.io
        const updatedNotification = notifications.find(n => n.id === notificationId);
        if (updatedNotification) {
          const socket = socketManager.getSocket();
          if (socket) {
            socket.emit('broadcast-notification', {
              userId: userId!,
              notification: { ...updatedNotification, read: true }
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [notifications, userId]);

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
    error,
    refresh: fetchNotifications,
  };
}

export default useSocketNotifications;