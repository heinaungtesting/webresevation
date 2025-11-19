'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/me/notifications?limit=10');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

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
      const response = await fetch('/api/users/me/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          notificationIds
            ? { notificationIds }
            : { markAll: true }
        ),
      });

      if (response.ok) {
        if (notificationIds) {
          setNotifications(prev =>
            prev.map(n =>
              notificationIds.includes(n.id) ? { ...n, read: true } : n
            )
          );
          setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
        } else {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          setUnreadCount(0);
        }
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/users/me/notifications?id=${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const notification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      const response = await fetch('/api/users/me/notifications?all=true', {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

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
