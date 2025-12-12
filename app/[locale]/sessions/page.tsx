'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/contexts/AuthContext';
import SessionCard from '@/app/components/SessionCard';
import { Session } from '@/types';
import Select from '@/app/components/ui/Select';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import Loading from '@/app/components/ui/Loading';
import { Search, Filter, Plus, RefreshCw, Calendar } from 'lucide-react';

export default function SessionsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('browseSessions');
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [sportFilter, skillFilter, startDate, endDate]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError('');

      // Build query params
      const params = new URLSearchParams();
      if (sportFilter !== 'all') params.append('sport_type', sportFilter);
      if (skillFilter !== 'all') params.append('skill_level', skillFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`/api/sessions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');

      const result = await response.json();
      setSessions(result.data || []);
    } catch (err: any) {
      console.error('Error fetching sessions:', err);
      setError(err.message || t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSessions();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSportFilter('all');
    setSkillFilter('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              {t('title')}
            </h1>
            {user && (
              <Button
                variant="primary"
                onClick={() => router.push(`/${locale}/sessions/create`)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('createSession')}
              </Button>
            )}
          </div>
          <p className="text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" className="gap-2">
                <Search className="w-4 h-4" />
                {t('search')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                {t('filters')}
              </Button>
            </div>
          </form>

          {showFilters && (
            <div className="mt-4 pt-4 border-t space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label={t('sportType')}
                  value={sportFilter}
                  onChange={(e) => setSportFilter(e.target.value)}
                  fullWidth
                  options={[
                    { value: 'all', label: t('allSports') },
                    { value: 'badminton', label: t('sports.badminton') },
                    { value: 'basketball', label: t('sports.basketball') },
                    { value: 'volleyball', label: t('sports.volleyball') },
                    { value: 'tennis', label: t('sports.tennis') },
                    { value: 'soccer', label: t('sports.soccer') },
                    { value: 'futsal', label: t('sports.futsal') },
                    { value: 'table-tennis', label: t('sports.tableTennis') },
                  ]}
                />
                <Select
                  label={t('skillLevel')}
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  fullWidth
                  options={[
                    { value: 'all', label: t('allLevels') },
                    { value: 'beginner', label: t('skillLevels.beginner') },
                    { value: 'intermediate', label: t('skillLevels.intermediate') },
                    { value: 'advanced', label: t('skillLevels.advanced') },
                  ]}
                />
              </div>

              {/* Date Range Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {t('fromDate')}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-h-[44px] w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {t('toDate')}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-h-[44px] w-full"
                  />
                </div>
              </div>

              {/* Clear Filters Button */}
              {(sportFilter !== 'all' || skillFilter !== 'all' || startDate || endDate) && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                  >
                    {t('clearAllFilters')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-800">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSessions}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {t('retry')}
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loading text={t('loading')} />
          </div>
        ) : (
          <>
            {/* Results */}
            <div className="mb-4 text-gray-600">
              {t(sessions.length === 1 ? 'sessionsFound' : 'sessionsFoundPlural', { count: sessions.length })}
            </div>

            {/* Sessions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>

            {sessions.length === 0 && !error && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {t('noSessionsFound')}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={clearFilters}
                >
                  {t('clearFilters')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
