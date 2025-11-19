'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import SessionCard from '@/app/components/SessionCard';
import { Session } from '@/types';
import Select from '@/app/components/ui/Select';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import Loading from '@/app/components/ui/Loading';
import { Search, Filter, Plus, RefreshCw } from 'lucide-react';

export default function SessionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [sportFilter, skillFilter]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError('');

      // Build query params
      const params = new URLSearchParams();
      if (sportFilter !== 'all') params.append('sport_type', sportFilter);
      if (skillFilter !== 'all') params.append('skill_level', skillFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/sessions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');

      const data = await response.json();
      setSessions(data);
    } catch (err: any) {
      console.error('Error fetching sessions:', err);
      setError(err.message || 'Failed to load sessions');
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
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Browse Sessions
            </h1>
            {user && (
              <Button
                variant="primary"
                onClick={() => router.push('/sessions/create')}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Session
              </Button>
            )}
          </div>
          <p className="text-gray-600">
            Find and join sports sessions near you
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <Input
                placeholder="Search by sport or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" className="gap-2">
                <Search className="w-4 h-4" />
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </form>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <Select
                label="Sport Type"
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                fullWidth
                options={[
                  { value: 'all', label: 'All Sports' },
                  { value: 'badminton', label: 'Badminton' },
                  { value: 'basketball', label: 'Basketball' },
                  { value: 'volleyball', label: 'Volleyball' },
                  { value: 'tennis', label: 'Tennis' },
                  { value: 'soccer', label: 'Soccer' },
                  { value: 'futsal', label: 'Futsal' },
                  { value: 'table-tennis', label: 'Table Tennis' },
                ]}
              />
              <Select
                label="Skill Level"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                fullWidth
                options={[
                  { value: 'all', label: 'All Levels' },
                  { value: 'beginner', label: 'Beginner' },
                  { value: 'intermediate', label: 'Intermediate' },
                  { value: 'advanced', label: 'Advanced' },
                ]}
              />
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
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loading text="Loading sessions..." />
          </div>
        ) : (
          <>
            {/* Results */}
            <div className="mb-4 text-gray-600">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} found
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
                  No sessions found matching your criteria
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
