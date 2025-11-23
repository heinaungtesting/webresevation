'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { BookingCard } from '@/app/components/bookings/BookingCard';
import { Button } from '@/app/components/ui/Button';
import { Select } from '@/app/components/ui/Select';
import { Skeleton } from '@/app/components/ui/Skeleton';
import Link from 'next/link';
import type { Booking } from '@/types/venue-booking';

export default function BookingsPage() {
  const locale = useLocale();
  const isJa = locale === 'ja';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/bookings?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bookings');
      }

      setBookings(data.bookings);
      setTotalPages(data.pagination.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter]);

  const upcomingBookings = bookings.filter(b =>
    ['PENDING', 'CONFIRMED'].includes(b.status) &&
    new Date(b.booking_date) >= new Date(new Date().toDateString())
  );

  const pastBookings = bookings.filter(b =>
    !['PENDING', 'CONFIRMED'].includes(b.status) ||
    new Date(b.booking_date) < new Date(new Date().toDateString())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isJa ? '予約一覧' : 'My Bookings'}
            </h1>
            <p className="text-gray-600">
              {isJa ? 'コートの予約を管理できます' : 'Manage your court bookings'}
            </p>
          </div>
          <Link href={`/${locale}/venues`}>
            <Button>{isJa ? '新規予約' : 'New Booking'}</Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              {isJa ? 'ステータス' : 'Status'}
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-40"
            >
              <option value="">{isJa ? 'すべて' : 'All'}</option>
              <option value="PENDING">{isJa ? '保留中' : 'Pending'}</option>
              <option value="CONFIRMED">{isJa ? '確定' : 'Confirmed'}</option>
              <option value="COMPLETED">{isJa ? '完了' : 'Completed'}</option>
              <option value="CANCELLED">{isJa ? 'キャンセル' : 'Cancelled'}</option>
            </Select>
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
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Bookings */}
        {!loading && bookings.length > 0 && (
          <div className="space-y-6">
            {/* Upcoming Bookings */}
            {upcomingBookings.length > 0 && !statusFilter && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {isJa ? '今後の予約' : 'Upcoming Bookings'}
                </h2>
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </div>
            )}

            {/* Past/Other Bookings */}
            {(pastBookings.length > 0 || statusFilter) && (
              <div>
                {!statusFilter && upcomingBookings.length > 0 && (
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {isJa ? '過去の予約' : 'Past Bookings'}
                  </h2>
                )}
                <div className="space-y-4">
                  {(statusFilter ? bookings : pastBookings).map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && bookings.length === 0 && !error && (
          <div className="text-center py-12 bg-white rounded-lg">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isJa ? '予約がありません' : 'No bookings yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {isJa
                ? '施設を検索して予約を始めましょう'
                : 'Start by finding a venue and booking a court'}
            </p>
            <Link href={`/${locale}/venues`}>
              <Button>{isJa ? '施設を探す' : 'Find Venues'}</Button>
            </Link>
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
