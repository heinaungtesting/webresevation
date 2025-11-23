'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import { useAuth } from '@/app/contexts/AuthContext';
import { useSocketNotifications } from '@/lib/hooks/useSocketNotifications';
import { csrfPatch, csrfDelete } from '@/lib/csrfClient';

export default function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use Socket.io hook for real-time notifications
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isLoading: loading,
    error,
    isConnected
  } = useSocketNotifications({
    userId: user?.id,
    enableBrowserNotifications: true,
    enableSounds: true
  });


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
          await markAsRead(id);
        }
      } else {
        // Mark all notifications as read
        await markAllAsRead();
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await csrfDelete(`/api/users/me/notifications?id=${notificationId}`);
      // The Socket hook will automatically update the state via real-time events
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await csrfDelete('/api/users/me/notifications?all=true');
      // The Socket hook will automatically update the state via real-time events
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
