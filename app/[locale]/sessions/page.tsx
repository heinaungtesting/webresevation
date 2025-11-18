'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import SessionCard from '@/app/components/SessionCard';
import { Session, SportType, SkillLevel } from '@/types';
import Select from '@/app/components/ui/Select';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import { Search, Filter, Plus } from 'lucide-react';

// Mock data - same as homepage
const mockSessions: Session[] = [
  {
    id: '1',
    sport_center_id: '1',
    sport_type: 'badminton',
    skill_level: 'intermediate',
    date_time: new Date(Date.now() + 86400000).toISOString(),
    duration_minutes: 120,
    max_participants: 8,
    current_participants: 5,
    description_en: 'Fun badminton session for intermediate players',
    created_by: 'user1',
    created_at: new Date().toISOString(),
    sport_center: {
      id: '1',
      name_en: 'Tokyo Sport Center',
      name_ja: '東京スポーツセンター',
      address_en: 'Shibuya, Tokyo',
      address_ja: '東京都渋谷区',
    },
  },
  {
    id: '2',
    sport_center_id: '2',
    sport_type: 'basketball',
    skill_level: 'beginner',
    date_time: new Date(Date.now() + 172800000).toISOString(),
    duration_minutes: 90,
    max_participants: 10,
    current_participants: 3,
    description_en: 'Casual basketball game for beginners',
    created_by: 'user2',
    created_at: new Date().toISOString(),
    sport_center: {
      id: '2',
      name_en: 'Shinjuku Sports Plaza',
      name_ja: '新宿スポーツプラザ',
      address_en: 'Shinjuku, Tokyo',
      address_ja: '東京都新宿区',
    },
  },
  {
    id: '3',
    sport_center_id: '3',
    sport_type: 'tennis',
    skill_level: 'advanced',
    date_time: new Date(Date.now() + 259200000).toISOString(),
    duration_minutes: 120,
    max_participants: 4,
    current_participants: 4,
    description_en: 'Advanced tennis doubles match',
    created_by: 'user3',
    created_at: new Date().toISOString(),
    sport_center: {
      id: '3',
      name_en: 'Roppongi Tennis Club',
      name_ja: '六本木テニスクラブ',
      address_en: 'Roppongi, Tokyo',
      address_ja: '東京都港区六本木',
    },
  },
  {
    id: '4',
    sport_center_id: '1',
    sport_type: 'volleyball',
    skill_level: 'intermediate',
    date_time: new Date(Date.now() + 345600000).toISOString(),
    duration_minutes: 90,
    max_participants: 12,
    current_participants: 8,
    description_en: 'Friendly volleyball match',
    created_by: 'user4',
    created_at: new Date().toISOString(),
    sport_center: {
      id: '1',
      name_en: 'Tokyo Sport Center',
      name_ja: '東京スポーツセンター',
      address_en: 'Shibuya, Tokyo',
      address_ja: '東京都渋谷区',
    },
  },
  {
    id: '5',
    sport_center_id: '2',
    sport_type: 'badminton',
    skill_level: 'beginner',
    date_time: new Date(Date.now() + 432000000).toISOString(),
    duration_minutes: 120,
    max_participants: 6,
    current_participants: 2,
    description_en: 'Learn badminton basics',
    created_by: 'user5',
    created_at: new Date().toISOString(),
    sport_center: {
      id: '2',
      name_en: 'Shinjuku Sports Plaza',
      name_ja: '新宿スポーツプラザ',
      address_en: 'Shinjuku, Tokyo',
      address_ja: '東京都新宿区',
    },
  },
];

export default function SessionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredSessions = mockSessions.filter((session) => {
    const matchesSearch =
      searchQuery === '' ||
      session.sport_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.sport_center?.name_en.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSport = sportFilter === 'all' || session.sport_type === sportFilter;
    const matchesSkill = skillFilter === 'all' || session.skill_level === skillFilter;

    return matchesSearch && matchesSport && matchesSkill;
  });

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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <Input
                placeholder="Search by sport or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

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

        {/* Results */}
        <div className="mb-4 text-gray-600">
          {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} found
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>

        {filteredSessions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No sessions found matching your criteria
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                setSportFilter('all');
                setSkillFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
