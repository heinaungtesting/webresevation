'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  MessageSquare,
  UserPlus,
  Star,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import ErrorMessage from '@/app/components/ui/ErrorMessage';
import Loading from '@/app/components/ui/Loading';
import { csrfPatch, csrfDelete } from '@/lib/csrfClient';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/users/me/notifications?limit=100');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data.notifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'session_joined':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'session_left':
        return <UserPlus className="w-5 h-5 text-red-500" />;
      case 'session_reminder':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'session_cancelled':
        return <Calendar className="w-5 h-5 text-red-500" />;
      case 'new_message':
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      case 'new_review':
        return <Star className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleMarkAsRead = async (notificationIds?: string[]) => {
    try {
      await csrfPatch('/api/users/me/notifications',
        notificationIds ? { notificationIds } : { markAll: true }
      );

      if (notificationIds) {
        setNotifications(prev =>
          prev.map(n =>
            notificationIds.includes(n.id) ? { ...n, read: true } : n
          )
        );
      } else {
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
    if (!confirm('Are you sure you want to delete all notifications?')) return;

    try {
      await csrfDelete('/api/users/me/notifications?all=true');
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead([notification.id]);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorMessage
            title="Please log in"
            message="You need to be logged in to view notifications"
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Loading text="Loading notifications..." fullScreen />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500">{unreadCount} unread</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAsRead()}
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage title="Error" message={error} />
          </div>
        )}

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card padding="lg" className="text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No notifications
            </h2>
            <p className="text-gray-500">
              You don't have any notifications yet. They'll appear here when you
              get them.
            </p>
          </Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`relative group ${!notification.read ? 'bg-blue-50' : 'bg-white'
                    } hover:bg-gray-50 transition-colors`}
                >
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full text-left px-4 py-4 sm:px-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${!notification.read
                              ? 'font-semibold text-gray-900'
                              : 'font-medium text-gray-700'
                            }`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}{' '}
                          &middot;{' '}
                          {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Actions */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead([notification.id]);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Unread indicator */}
                  {!notification.read && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
