'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Card } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import type { Booking } from '@/types/venue-booking';

interface BookingCardProps {
  booking: Booking;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  NO_SHOW: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, { en: string; ja: string }> = {
  PENDING: { en: 'Pending', ja: '保留中' },
  CONFIRMED: { en: 'Confirmed', ja: '確定' },
  CANCELLED: { en: 'Cancelled', ja: 'キャンセル' },
  COMPLETED: { en: 'Completed', ja: '完了' },
  NO_SHOW: { en: 'No Show', ja: '不参加' },
};

export function BookingCard({ booking }: BookingCardProps) {
  const locale = useLocale();
  const isJa = locale === 'ja';

  const formatPrice = (price: number) => `¥${price.toLocaleString()}`;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const statusLabel = statusLabels[booking.status]?.[isJa ? 'ja' : 'en'] || booking.status;

  return (
    <Link href={`/${locale}/bookings/${booking.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">
                {isJa ? booking.venue?.name_ja : booking.venue?.name_en}
              </h3>
              <p className="text-sm text-gray-600">
                {isJa ? booking.court?.name_ja : booking.court?.name_en}
              </p>
            </div>
            <Badge className={statusColors[booking.status]}>
              {statusLabel}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            {/* Date */}
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(booking.booking_date)}
            </div>

            {/* Time */}
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {booking.start_time} - {booking.end_time}
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t">
            <div className="flex items-center text-sm text-gray-500">
              <span className="capitalize">{booking.court?.sport_type}</span>
              <span className="mx-2">•</span>
              <span>{booking.duration_minutes} {isJa ? '分' : 'min'}</span>
            </div>
            <div className="font-semibold text-blue-600">
              {formatPrice(booking.total_amount)}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
