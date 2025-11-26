'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import SessionCard from '@/app/components/SessionCard';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Badge from '@/app/components/ui/Badge';
import { Calendar, Clock, TrendingUp, History, Loader2, Plus } from 'lucide-react';
import { csrfDelete } from '@/lib/csrfClient';

interface AttendedSession {
  attendance_id: string;
  marked_at: string;
  session: any;
}

interface MySessionsData {
  upcoming: AttendedSession[];
  past: AttendedSession[];
  total: number;
}

export default function MySessionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<MySessionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirectTo=/my-sessions');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchMySessions();
    }
  }, [user]);

  const fetchMySessions = async () => {
    try {
      setLoading(true);

      // Fetch upcoming and past sessions in parallel
      const [upcomingResponse, pastResponse] = await Promise.all([
        fetch('/api/users/me/sessions?type=upcoming&limit=100'),
        fetch('/api/users/me/sessions?type=past&limit=100'),
      ]);

      if (!upcomingResponse.ok || !pastResponse.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const upcomingData = await upcomingResponse.json();
      const pastData = await pastResponse.json();

      setData({
        upcoming: upcomingData.data || [],
        past: pastData.data || [],
        total: (upcomingData.pagination?.totalCount || 0) + (pastData.pagination?.totalCount || 0),
      });
    } catch (err) {
      setError('Failed to load your sessions');
      console.error(err);
      // Set empty data to prevent undefined errors
      setData({
        upcoming: [],
        past: [],
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAttendance = async (sessionId: string) => {
    if (!confirm('Are you sure you want to cancel your attendance?')) {
      return;
    }

    setCancellingId(sessionId);

    try {
      await csrfDelete('/api/attendance', {
        body: JSON.stringify({ session_id: sessionId }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Refresh the sessions list
      await fetchMySessions();
    } catch (err) {
      alert('Failed to cancel attendance. Please try again.');
      console.error(err);
    } finally {
      setCancellingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  const sessions = activeTab === 'upcoming' ? data?.upcoming || [] : data?.past || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Sessions
              </h1>
              <p className="text-gray-600">
                View and manage your sports sessions
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => router.push('/my-sessions/created')}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              My Created Sessions
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Upcoming Sessions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.upcoming.length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <History className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Past Sessions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.past.length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.total || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'upcoming'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Upcoming ({data?.upcoming.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'past'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Past ({data?.past.length || 0})
              </button>
            </nav>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Sessions Grid */}
        {sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((attendedSession) => (
              <div key={attendedSession.attendance_id} className="relative">
                <SessionCard session={attendedSession.session} />

                {/* Cancel Button Overlay for Upcoming Sessions */}
                {activeTab === 'upcoming' && (
                  <div className="mt-3">
                    <Button
                      variant="danger"
                      size="sm"
                      fullWidth
                      disabled={cancellingId === attendedSession.session.id}
                      onClick={() => handleCancelAttendance(attendedSession.session.id)}
                    >
                      {cancellingId === attendedSession.session.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        'Cancel Attendance'
                      )}
                    </Button>
                  </div>
                )}

                {/* Badge for Past Sessions */}
                {activeTab === 'past' && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="default">Completed</Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Card padding="lg">
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {activeTab === 'upcoming'
                  ? 'No Upcoming Sessions'
                  : 'No Past Sessions'}
              </h3>
              <p className="text-gray-600 mb-6">
                {activeTab === 'upcoming'
                  ? "You haven't signed up for any sessions yet."
                  : "You haven't attended any sessions yet."}
              </p>
              {activeTab === 'upcoming' && (
                <Link href="/sessions">
                  <Button variant="primary">Browse Sessions</Button>
                </Link>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
