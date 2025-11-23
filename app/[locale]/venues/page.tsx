'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { VenueCard } from '@/app/components/venues/VenueCard';
import { Select } from '@/app/components/ui/Select';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Skeleton';

const sportTypes = [
  { value: '', label: { en: 'All Sports', ja: 'すべて' } },
  { value: 'badminton', label: { en: 'Badminton', ja: 'バドミントン' } },
  { value: 'tennis', label: { en: 'Tennis', ja: 'テニス' } },
  { value: 'basketball', label: { en: 'Basketball', ja: 'バスケットボール' } },
  { value: 'volleyball', label: { en: 'Volleyball', ja: 'バレーボール' } },
  { value: 'futsal', label: { en: 'Futsal', ja: 'フットサル' } },
  { value: 'table-tennis', label: { en: 'Table Tennis', ja: '卓球' } },
];

interface Venue {
  id: string;
  name_en: string;
  name_ja: string;
  address_en: string;
  address_ja: string;
  station_en?: string | null;
  station_ja?: string | null;
  image_url?: string | null;
  courts_count: number;
  min_price: number | null;
  max_price: number | null;
  sport_types: string[];
  amenities: Array<{
    name_en: string;
    name_ja: string;
    icon?: string | null;
    is_free: boolean;
  }>;
}

export default function VenuesPage() {
  const locale = useLocale();
  const isJa = locale === 'ja';

  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [sportType, setSportType] = useState('');
  const [stationSearch, setStationSearch] = useState('');
  const [indoor, setIndoor] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchVenues = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '12');

      if (sportType) params.set('sport_type', sportType);
      if (stationSearch) params.set('near_station', stationSearch);
      if (indoor) params.set('indoor', indoor);

      const response = await fetch(`/api/venues?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch venues');
      }

      setVenues(data.venues);
      setTotalPages(data.pagination.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, [page, sportType, indoor]);

  const handleSearch = () => {
    setPage(1);
    fetchVenues();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isJa ? '施設を予約' : 'Book a Venue'}
          </h1>
          <p className="text-gray-600">
            {isJa
              ? 'スポーツ施設のコートを直接予約できます'
              : 'Book courts directly at sports facilities'}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Sport Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isJa ? 'スポーツ' : 'Sport'}
              </label>
              <Select
                value={sportType}
                onChange={(e) => {
                  setSportType(e.target.value);
                  setPage(1);
                }}
              >
                {sportTypes.map((sport) => (
                  <option key={sport.value} value={sport.value}>
                    {isJa ? sport.label.ja : sport.label.en}
                  </option>
                ))}
              </Select>
            </div>

            {/* Station Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isJa ? '最寄り駅' : 'Near Station'}
              </label>
              <Input
                type="text"
                placeholder={isJa ? '駅名を入力' : 'Enter station name'}
                value={stationSearch}
                onChange={(e) => setStationSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            {/* Indoor/Outdoor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isJa ? '屋内/屋外' : 'Indoor/Outdoor'}
              </label>
              <Select
                value={indoor}
                onChange={(e) => {
                  setIndoor(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">{isJa ? 'すべて' : 'All'}</option>
                <option value="true">{isJa ? '屋内' : 'Indoor'}</option>
                <option value="false">{isJa ? '屋外' : 'Outdoor'}</option>
              </Select>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                {isJa ? '検索' : 'Search'}
              </Button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <div className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Venues Grid */}
        {!loading && venues.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && venues.length === 0 && !error && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isJa ? '施設が見つかりません' : 'No venues found'}
            </h3>
            <p className="text-gray-500">
              {isJa
                ? '検索条件を変更してください'
                : 'Try adjusting your search filters'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              {isJa ? '前へ' : 'Previous'}
            </Button>
            <span className="px-4 py-2 text-gray-600">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              {isJa ? '次へ' : 'Next'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
