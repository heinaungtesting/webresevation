'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { Card } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { Button } from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Skeleton';
import type { Booking } from '@/types/venue-booking';

interface BookingDetail extends Booking {
  venue: {
    id: string;
    name_en: string;
    name_ja: string;
    address_en: string;
    address_ja: string;
    phone?: string;
    latitude?: number;
    longitude?: number;
  };
  court: {
    id: string;
    name_en: string;
    name_ja: string;
    sport_type: string;
    indoor: boolean;
    has_equipment: boolean;
  };
  cancellation_policy: {
    can_cancel: boolean;
    refund_amount: number;
    refund_percentage: number;
  };
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
  CANCELLED: { en: 'Cancelled', ja: 'キャンセル済み' },
  COMPLETED: { en: 'Completed', ja: '完了' },
  NO_SHOW: { en: 'No Show', ja: '不参加' },
};

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isJa = locale === 'ja';

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const isSuccess = searchParams.get('success') === 'true';

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch booking');
        }

        setBooking(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const handleCancel = async () => {
    setCancelling(true);

    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: cancelReason || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel booking');
      }

      // Refresh booking data
      setBooking(prev => prev ? { ...prev, status: 'CANCELLED' as const } : null);
      setShowCancelConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setCancelling(false);
    }
  };

  const formatPrice = (price: number) => `¥${price.toLocaleString()}`;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isJa ? 'ja-JP' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Card className="p-6">
            <Skeleton className="h-6 w-1/2 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <Skeleton className="h-32 w-full" />
          </Card>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            {isJa ? 'エラー' : 'Error'}
          </h2>
          <p className="text-gray-600 mb-4">{error || (isJa ? '予約が見つかりません' : 'Booking not found')}</p>
          <Link href={`/${locale}/bookings`}>
            <Button>{isJa ? '予約一覧に戻る' : 'Back to Bookings'}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const statusLabel = statusLabels[booking.status]?.[isJa ? 'ja' : 'en'] || booking.status;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Success Banner */}
        {isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-700 font-medium">
                {isJa ? '予約が完了しました！' : 'Booking confirmed!'}
              </span>
            </div>
          </div>
        )}

        {/* Back link */}
        <Link href={`/${locale}/bookings`} className="text-blue-600 hover:underline text-sm mb-4 inline-block">
          &larr; {isJa ? '予約一覧に戻る' : 'Back to bookings'}
        </Link>

        {/* Booking Header */}
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isJa ? '予約詳細' : 'Booking Details'}
              </h1>
              <p className="text-sm text-gray-500">ID: {booking.id.slice(0, 8)}...</p>
            </div>
            <Badge className={`${statusColors[booking.status]} text-sm px-3 py-1`}>
              {statusLabel}
            </Badge>
          </div>

          {/* Venue & Court Info */}
          <div className="border-b pb-4 mb-4">
            <h2 className="font-semibold text-lg mb-1">
              {isJa ? booking.venue.name_ja : booking.venue.name_en}
            </h2>
            <p className="text-gray-600 mb-1">
              {isJa ? booking.court.name_ja : booking.court.name_en}
            </p>
            <p className="text-sm text-gray-500">
              {isJa ? booking.venue.address_ja : booking.venue.address_en}
            </p>
          </div>

          {/* Booking Details */}
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">{isJa ? '日付' : 'Date'}</span>
              <span className="font-medium">{formatDate(booking.booking_date)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">{isJa ? '時間' : 'Time'}</span>
              <span className="font-medium">{booking.start_time} - {booking.end_time}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">{isJa ? '時間' : 'Duration'}</span>
              <span className="font-medium">{booking.duration_minutes} {isJa ? '分' : 'minutes'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">{isJa ? 'スポーツ' : 'Sport'}</span>
              <span className="font-medium capitalize">{booking.court.sport_type}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">{isJa ? '料金' : 'Total'}</span>
              <span className="font-bold text-blue-600 text-lg">{formatPrice(booking.total_amount)}</span>
            </div>
          </div>

          {/* Court Features */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap gap-2 text-sm">
              {booking.court.indoor && (
                <span className="px-2 py-1 bg-white rounded border text-gray-600">
                  {isJa ? '屋内' : 'Indoor'}
                </span>
              )}
              {booking.court.has_equipment && (
                <span className="px-2 py-1 bg-white rounded border text-gray-600">
                  {isJa ? '用具レンタル' : 'Equipment'}
                </span>
              )}
            </div>
          </div>

          {/* Notes */}
          {booking.user_notes && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                {isJa ? 'メモ' : 'Notes'}
              </h3>
              <p className="text-gray-600 text-sm">{booking.user_notes}</p>
            </div>
          )}
        </Card>

        {/* Contact Info */}
        {booking.venue.phone && (
          <Card className="p-4 mb-6">
            <h3 className="font-medium mb-2">{isJa ? '施設連絡先' : 'Venue Contact'}</h3>
            <a href={`tel:${booking.venue.phone}`} className="text-blue-600 hover:underline flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {booking.venue.phone}
            </a>
          </Card>
        )}

        {/* Cancellation */}
        {booking.cancellation_policy.can_cancel && booking.status !== 'CANCELLED' && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">{isJa ? 'キャンセル' : 'Cancel Booking'}</h3>

            {!showCancelConfirm ? (
              <>
                <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    {booking.cancellation_policy.refund_percentage === 100
                      ? (isJa ? '全額返金されます' : 'Full refund available')
                      : booking.cancellation_policy.refund_percentage > 0
                        ? (isJa
                            ? `${booking.cancellation_policy.refund_percentage}%返金 (${formatPrice(booking.cancellation_policy.refund_amount)})`
                            : `${booking.cancellation_policy.refund_percentage}% refund (${formatPrice(booking.cancellation_policy.refund_amount)})`)
                        : (isJa ? '返金はありません' : 'No refund available')}
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowCancelConfirm(true)} className="text-red-600 border-red-600 hover:bg-red-50">
                  {isJa ? '予約をキャンセル' : 'Cancel Booking'}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-700 font-medium mb-2">
                    {isJa ? '本当にキャンセルしますか？' : 'Are you sure you want to cancel?'}
                  </p>
                  <p className="text-sm text-red-600">
                    {booking.cancellation_policy.refund_percentage > 0
                      ? (isJa
                          ? `${formatPrice(booking.cancellation_policy.refund_amount)}が返金されます`
                          : `You will receive a refund of ${formatPrice(booking.cancellation_policy.refund_amount)}`)
                      : (isJa ? 'この予約をキャンセルすると返金はありません' : 'You will not receive a refund for this cancellation')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isJa ? 'キャンセル理由（任意）' : 'Cancellation Reason (optional)'}
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                    rows={2}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={cancelling}
                    className="flex-1"
                  >
                    {isJa ? '戻る' : 'Go Back'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {cancelling
                      ? (isJa ? 'キャンセル中...' : 'Cancelling...')
                      : (isJa ? 'キャンセルを確定' : 'Confirm Cancellation')}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Cancelled Info */}
        {booking.status === 'CANCELLED' && (
          <Card className="p-6 bg-red-50 border-red-200">
            <h3 className="font-semibold text-red-800 mb-2">{isJa ? 'キャンセル済み' : 'Booking Cancelled'}</h3>
            {booking.cancelled_at && (
              <p className="text-sm text-red-600 mb-1">
                {isJa ? 'キャンセル日時: ' : 'Cancelled on: '}
                {new Date(booking.cancelled_at).toLocaleString(isJa ? 'ja-JP' : 'en-US')}
              </p>
            )}
            {booking.cancellation_reason && (
              <p className="text-sm text-red-600">
                {isJa ? '理由: ' : 'Reason: '}{booking.cancellation_reason}
              </p>
            )}
            {booking.refund_amount !== undefined && booking.refund_amount > 0 && (
              <p className="text-sm text-red-600 mt-2">
                {isJa ? '返金額: ' : 'Refund: '}{formatPrice(booking.refund_amount)}
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
