'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Badge from '@/app/components/ui/Badge';
import Loading from '@/app/components/ui/Loading';
import ErrorMessage from '@/app/components/ui/ErrorMessage';
import { formatDate, formatTime } from '@/lib/utils';
import { csrfDelete } from '@/lib/csrfClient';

interface Session {
  id: string;
  sport_type: string;
  skill_level: string;
  date_time: string;
  duration_minutes: number;
  max_participants: number | null;
  current_participants: number;
  description_en?: string;
  description_ja?: string;
  sport_center: {
    id: string;
    name_en: string;
    name_ja: string;
    address_en: string;
    address_ja: string;
  };
  participants: Array<{
    id: string;
    email: string;
    username?: string;
    display_name?: string;
  }>;
}

export default function MyCreatedSessionsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('createdSessions');
  const tMySessions = useTranslations('mySessions');
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchCreatedSessions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCreatedSessions = async () => {
    try {
      const response = await fetch('/api/users/me/created-sessions');
      if (!response.ok) throw new Error('Failed to fetch sessions');

      const data = await response.json();
      setSessions(data);
    } catch (err: any) {
      console.error('Error fetching created sessions:', err);
      setError(err.message || t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async (sessionId: string, sportType: string) => {
    if (!confirm(t('confirmCancelSession', { sportType }))) {
      return;
    }

    try {
      await csrfDelete(`/api/sessions/${sessionId}`);

      // Refresh the list
      await fetchCreatedSessions();
    } catch (err: any) {
      alert(err.message || t('failedToCancel'));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorMessage
            title={t('pleaseLogin')}
            message={t('needLogin')}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Loading text={t('loading')} fullScreen />
      </div>
    );
  }

  const now = new Date();
  const upcomingSessions = sessions.filter((s) => new Date(s.date_time) > now);
  const pastSessions = sessions.filter((s) => new Date(s.date_time) <= now);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${locale}/my-sessions`)}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-600">{t('subtitle')}</p>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push(`/${locale}/sessions/create`)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('createNewSession')}
          </Button>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={fetchCreatedSessions} />
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card padding="md">
            <p className="text-sm text-gray-600 mb-1">{t('totalCreated')}</p>
            <p className="text-3xl font-bold text-gray-900">{sessions.length}</p>
          </Card>
          <Card padding="md">
            <p className="text-sm text-gray-600 mb-1">{tMySessions('upcoming')}</p>
            <p className="text-3xl font-bold text-green-600">{upcomingSessions.length}</p>
          </Card>
          <Card padding="md">
            <p className="text-sm text-gray-600 mb-1">{tMySessions('past')}</p>
            <p className="text-3xl font-bold text-gray-600">{pastSessions.length}</p>
          </Card>
        </div>

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {tMySessions('upcomingSessions')}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {upcomingSessions.map((session) => (
                <Card key={session.id} padding="md">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 capitalize">
                          {session.sport_type.replace('-', ' ')}
                        </h3>
                        <Badge variant="success">{session.skill_level}</Badge>
                        <Badge variant="info">
                          <Users className="w-3 h-3 mr-1" />
                          {session.current_participants}
                          {session.max_participants ? `/${session.max_participants}` : ''} {t('going')}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {session.sport_center.name_en}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {formatDate(session.date_time)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {formatTime(session.date_time)} ({session.duration_minutes} {t('minutes')})
                        </div>
                      </div>

                      {session.description_en && (
                        <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                          {session.description_en}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/${locale}/sessions/${session.id}/edit`)}
                        className="gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        {t('edit')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelSession(session.id, session.sport_type)}
                        className="gap-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('cancel')}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Past Sessions */}
        {pastSessions.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {tMySessions('pastSessions')}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {pastSessions.map((session) => (
                <Card key={session.id} padding="md" className="opacity-75">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 capitalize">
                          {session.sport_type.replace('-', ' ')}
                        </h3>
                        <Badge variant="default">{session.skill_level}</Badge>
                        <Badge variant="info">
                          {session.current_participants} attended
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {session.sport_center.name_en}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {formatDate(session.date_time)}
                        </div>
                      </div>
                    </div>

                    <Badge variant="default">Completed</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {sessions.length === 0 && (
          <Card padding="lg">
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Sessions Created Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start organizing sports sessions and invite others to join!
              </p>
              <Button
                variant="primary"
                onClick={() => router.push('/sessions/create')}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Your First Session
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
