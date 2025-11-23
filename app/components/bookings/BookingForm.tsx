'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import type { TimeSlot, Court } from '@/types/venue-booking';

interface BookingFormProps {
  court: Court;
  selectedSlot: TimeSlot;
  selectedDate: string;
  venue: {
    id: string;
    name_en: string;
    name_ja: string;
  };
  onCancel: () => void;
}

export function BookingForm({
  court,
  selectedSlot,
  selectedDate,
  venue,
  onCancel,
}: BookingFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const isJa = locale === 'ja';

  const [userNotes, setUserNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (price: number) => `¥${price.toLocaleString()}`;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          court_id: court.id,
          booking_date: selectedDate,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          user_notes: userNotes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      // Redirect to booking confirmation page
      router.push(`/${locale}/bookings/${data.id}?success=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        {isJa ? '予約確認' : 'Confirm Booking'}
      </h3>

      <form onSubmit={handleSubmit}>
        {/* Booking Summary */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">{isJa ? '施設' : 'Venue'}</span>
            <span className="font-medium">{isJa ? venue.name_ja : venue.name_en}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">{isJa ? 'コート' : 'Court'}</span>
            <span className="font-medium">{isJa ? court.name_ja : court.name_en}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">{isJa ? 'スポーツ' : 'Sport'}</span>
            <span className="font-medium capitalize">{court.sport_type}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">{isJa ? '日付' : 'Date'}</span>
            <span className="font-medium">{formatDate(selectedDate)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">{isJa ? '時間' : 'Time'}</span>
            <span className="font-medium">
              {selectedSlot.start_time} - {selectedSlot.end_time}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">{isJa ? '料金' : 'Price'}</span>
            <span className="font-semibold text-blue-600">
              {formatPrice(selectedSlot.price)}
            </span>
          </div>
        </div>

        {/* Court features */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-2 text-sm">
            {court.indoor && (
              <span className="px-2 py-1 bg-white rounded border text-gray-600">
                {isJa ? '屋内' : 'Indoor'}
              </span>
            )}
            {court.has_lighting && (
              <span className="px-2 py-1 bg-white rounded border text-gray-600">
                {isJa ? '照明あり' : 'Lighting'}
              </span>
            )}
            {court.has_equipment && (
              <span className="px-2 py-1 bg-white rounded border text-gray-600">
                {isJa ? '用具レンタル' : 'Equipment'}
              </span>
            )}
            <span className="px-2 py-1 bg-white rounded border text-gray-600">
              {isJa ? `最大${court.max_players}人` : `Max ${court.max_players} players`}
            </span>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isJa ? 'メモ（任意）' : 'Notes (optional)'}
          </label>
          <textarea
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={isJa ? '特別なリクエストがあればこちらに記入してください' : 'Any special requests or notes...'}
          />
        </div>

        {/* Cancellation Policy */}
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">
            {isJa ? 'キャンセルポリシー' : 'Cancellation Policy'}
          </h4>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• {isJa ? '24時間以上前: 全額返金' : '24+ hours before: Full refund'}</li>
            <li>• {isJa ? '12-24時間前: 50%返金' : '12-24 hours before: 50% refund'}</li>
            <li>• {isJa ? '12時間未満: 返金なし' : 'Less than 12 hours: No refund'}</li>
          </ul>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isJa ? 'キャンセル' : 'Cancel'}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting
              ? (isJa ? '予約中...' : 'Booking...')
              : (isJa ? '予約を確定' : 'Confirm Booking')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
