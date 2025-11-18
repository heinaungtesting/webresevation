'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  Users,
  Calendar,
  MapPin,
  MessageSquare,
  TrendingUp,
  Activity,
} from 'lucide-react';
import Card from '@/app/components/ui/Card';
import Loading from '@/app/components/ui/Loading';
import ErrorMessage from '@/app/components/ui/ErrorMessage';

interface AdminStats {
  overview: {
    totalUsers: number;
    totalSessions: number;
    totalSportCenters: number;
    totalMessages: number;
    recentUsers: number;
    upcomingSessions: number;
    activeSessions: number;
  };
  charts: {
    usersByMonth: Array<{ month: string; count: number }>;
    sessionsBySport: Array<{ sport: string; count: number }>;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch statistics');

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching admin stats:', err);
      setError(err.message || 'Failed to load admin statistics');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorMessage
            title="Please log in"
            message="You need to be logged in to access the admin dashboard"
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Loading text="Loading admin dashboard..." fullScreen />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorMessage message={error} onRetry={fetchStats} />
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.overview.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      subtitle: `${stats.overview.recentUsers} new this month`,
    },
    {
      title: 'Total Sessions',
      value: stats.overview.totalSessions,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      subtitle: `${stats.overview.upcomingSessions} upcoming`,
    },
    {
      title: 'Sport Centers',
      value: stats.overview.totalSportCenters,
      icon: MapPin,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Messages',
      value: stats.overview.totalMessages,
      icon: MessageSquare,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Active Now',
      value: stats.overview.activeSessions,
      icon: Activity,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      subtitle: 'Sessions in progress',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Overview and management of SportsMatch Tokyo
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => router.push('/admin/users')}
            className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
          >
            <Users className="w-6 h-6 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Manage Users</h3>
            <p className="text-sm text-gray-600">View and manage user accounts</p>
          </button>

          <button
            onClick={() => router.push('/admin/sport-centers')}
            className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-left"
          >
            <MapPin className="w-6 h-6 text-purple-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Sport Centers</h3>
            <p className="text-sm text-gray-600">Add and edit sport centers</p>
          </button>

          <button
            onClick={() => router.push('/sessions')}
            className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-green-300 hover:shadow-md transition-all text-left"
          >
            <Calendar className="w-6 h-6 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-900">View Sessions</h3>
            <p className="text-sm text-gray-600">Browse all sessions</p>
          </button>

          <button
            onClick={() => router.push('/profile')}
            className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all text-left"
          >
            <TrendingUp className="w-6 h-6 text-gray-600 mb-2" />
            <h3 className="font-semibold text-gray-900">My Profile</h3>
            <p className="text-sm text-gray-600">View your admin profile</p>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.title} padding="md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {stat.value.toLocaleString()}
                  </p>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-500">{stat.subtitle}</p>
                  )}
                </div>
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sessions by Sport */}
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Sessions by Sport
            </h3>
            <div className="space-y-3">
              {stats.charts.sessionsBySport.slice(0, 5).map((item) => (
                <div key={item.sport} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {item.sport.replace('-', ' ')}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{
                          width: `${
                            (item.count /
                              Math.max(...stats.charts.sessionsBySport.map((s) => s.count))) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              System Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Platform</span>
                <span className="text-sm font-medium text-gray-900">
                  SportsMatch Tokyo
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Total Users</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.overview.totalUsers}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Active Sessions</span>
                <span className="text-sm font-medium text-green-600">
                  {stats.overview.activeSessions}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Sport Centers</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.overview.totalSportCenters}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
