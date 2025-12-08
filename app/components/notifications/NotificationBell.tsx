'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import NotificationDropdown from './NotificationDropdown';
import { useAuth } from '@/app/contexts/AuthContext';
import { useUserNotifications } from '@/lib/realtime/client';
import { csrfPatch, csrfDelete } from '@/lib/csrfClient';

export default function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch initial notifications
  useEffect(() => {
    if (!user?.id) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users/me/notifications');
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data = await response.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user?.id]);

  // Subscribe to new notifications with Supabase Realtime
  // Debounce rapid updates to prevent excessive re-renders
  const debouncedSetNotifications = useDebouncedCallback((newNotifications: any[]) => {
    setNotifications(newNotifications);
  }, 100);

  const handleNewNotification = useCallback((notification: any) => {
    setNotifications(prev => {
      const newNotifications = [notification, ...prev];
      debouncedSetNotifications(newNotifications);
      return newNotifications;
    });

    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon.png',
      });
    }
  }, [debouncedSetNotifications]);

  useUserNotifications(user?.id || '', handleNewNotification);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (notificationIds?: string[]) => {
    try {
      if (notificationIds) {
        // Mark specific notifications as read
        for (const id of notificationIds) {
          await csrfPatch(`/api/users/me/notifications/${id}/read`, {});
          setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
          );
        }
      } else {
        // Mark all notifications as read
        await csrfPatch('/api/users/me/notifications/read-all', {});
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await csrfDelete(`/api/users/me/notifications?id=${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await csrfDelete('/api/users/me/notifications?all=true');
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  // Don't render if no user
  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          loading={loading}
          onMarkAsRead={handleMarkAsRead}
          onDelete={handleDelete}
          onClearAll={handleClearAll}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
