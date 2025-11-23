'use client';

import { useState, useEffect, use } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { Card } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { Button } from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Skeleton';
import { TimeSlotGrid } from '@/app/components/venues/TimeSlotGrid';
import { BookingForm } from '@/app/components/bookings/BookingForm';
import type { TimeSlot, Court } from '@/types/venue-booking';

interface VenueDetail {
  id: string;
  name_en: string;
  name_ja: string;
  address_en: string;
  address_ja: string;
  station_en?: string;
  station_ja?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  description_en?: string;
  description_ja?: string;
  phone?: string;
  email?: string;
  website?: string;
  is_bookable: boolean;
  courts: Court[];
  amenities: Array<{
    id: string;
    name_en: string;
    name_ja: string;
    icon?: string;
    is_free: boolean;
    price?: number;
  }>;
  operating_hours: Array<{
    day_of_week: number;
    open_time: string;
    close_time: string;
    is_closed: boolean;
  }>;
}

interface CourtAvailability {
  court: Court;
  slots: TimeSlot[];
  available_slots_count: number;
}

const dayNames = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ja: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
};

export default function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useLocale();
  const isJa = locale === 'ja';

  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking state
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availability, setAvailability] = useState<CourtAvailability[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Initialize date to today
  useEffect(() => {
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
  }, []);

  // Fetch venue details
  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const response = await fetch(`/api/venues/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch venue');
        }

        setVenue(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchVenue();
  }, [id]);

  // Fetch availability when date changes
  useEffect(() => {
    if (!selectedDate || !venue?.is_bookable) return;

    const fetchAvailability = async () => {
      setLoadingAvailability(true);
      try {
        const response = await fetch(`/api/venues/${id}/availability?date=${selectedDate}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch availability');
        }

        setAvailability(data.courts || []);
      } catch (err) {
        console.error('Availability error:', err);
        setAvailability([]);
      } finally {
        setLoadingAvailability(false);
      }
    };

    fetchAvailability();
  }, [id, selectedDate, venue?.is_bookable]);

  const handleSlotSelect = (court: Court, slot: TimeSlot | null) => {
    setSelectedCourt(slot ? court : null);
    setSelectedSlot(slot);
  };

  const handleProceedToBooking = () => {
    if (selectedCourt && selectedSlot) {
      setShowBookingForm(true);
    }
  };

  const formatPrice = (price: number) => `¥${price.toLocaleString()}`;

  // Generate date options (next 30 days)
  const dateOptions = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      value: date.toISOString().split('T')[0],
      label: date.toLocaleDateString(isJa ? 'ja-JP' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-64 w-full mb-6 rounded-lg" />
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            {isJa ? 'エラー' : 'Error'}
          </h2>
          <p className="text-gray-600 mb-4">{error || (isJa ? '施設が見つかりません' : 'Venue not found')}</p>
          <Link href={`/${locale}/venues`}>
            <Button>{isJa ? '施設一覧に戻る' : 'Back to Venues'}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const name = isJa ? venue.name_ja : venue.name_en;
  const address = isJa ? venue.address_ja : venue.address_en;
  const description = isJa ? venue.description_ja : venue.description_en;
  const station = isJa ? venue.station_ja : venue.station_en;

  // Booking form modal
  if (showBookingForm && selectedCourt && selectedSlot) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-lg mx-auto">
          <BookingForm
            court={selectedCourt}
            selectedSlot={selectedSlot}
            selectedDate={selectedDate}
            venue={{ id: venue.id, name_en: venue.name_en, name_ja: venue.name_ja }}
            onCancel={() => setShowBookingForm(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="h-64 bg-gray-200 relative">
        {venue.image_url ? (
          <img src={venue.image_url} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
            <svg className="w-24 h-24 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link href={`/${locale}/venues`} className="text-blue-600 hover:underline text-sm mb-4 inline-block">
          &larr; {isJa ? '施設一覧に戻る' : 'Back to venues'}
        </Link>

        {/* Venue Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{name}</h1>

          {station && (
            <p className="text-gray-600 flex items-center mb-2">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {station}
            </p>
          )}

          <p className="text-gray-600 mb-4">{address}</p>

          {description && <p className="text-gray-700 mb-4">{description}</p>}

          {/* Contact Info */}
          <div className="flex flex-wrap gap-4 text-sm">
            {venue.phone && (
              <a href={`tel:${venue.phone}`} className="text-blue-600 hover:underline flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {venue.phone}
              </a>
            )}
            {venue.website && (
              <a href={venue.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                {isJa ? 'ウェブサイト' : 'Website'}
              </a>
            )}
          </div>
        </div>

        {/* Operating Hours */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{isJa ? '営業時間' : 'Operating Hours'}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            {venue.operating_hours.map((hours) => (
              <div key={hours.day_of_week} className="flex justify-between py-1">
                <span className="text-gray-600">
                  {isJa ? dayNames.ja[hours.day_of_week] : dayNames.en[hours.day_of_week]}
                </span>
                <span className={hours.is_closed ? 'text-red-500' : 'text-gray-900'}>
                  {hours.is_closed ? (isJa ? '休業' : 'Closed') : `${hours.open_time}-${hours.close_time}`}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Amenities */}
        {venue.amenities.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">{isJa ? '設備' : 'Amenities'}</h2>
            <div className="flex flex-wrap gap-2">
              {venue.amenities.map((amenity) => (
                <Badge key={amenity.id} variant="outline" className="py-1 px-3">
                  {isJa ? amenity.name_ja : amenity.name_en}
                  {!amenity.is_free && amenity.price && (
                    <span className="ml-1 text-gray-500">({formatPrice(amenity.price)})</span>
                  )}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Booking Section */}
        {venue.is_bookable && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">{isJa ? 'コートを予約' : 'Book a Court'}</h2>

            {/* Date Picker */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isJa ? '日付を選択' : 'Select Date'}
              </label>
              <select
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot(null);
                  setSelectedCourt(null);
                }}
                className="w-full md:w-auto px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {dateOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability */}
            {loadingAvailability ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i}>
                    <Skeleton className="h-6 w-32 mb-3" />
                    <div className="grid grid-cols-6 gap-2">
                      {[...Array(6)].map((_, j) => (
                        <Skeleton key={j} className="h-16" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : availability.length > 0 ? (
              <div className="space-y-6">
                {availability.map((courtAvail) => (
                  <div key={courtAvail.court.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h3 className="font-medium">
                          {isJa ? courtAvail.court.name_ja : courtAvail.court.name_en}
                        </h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {courtAvail.court.sport_type} • {formatPrice(courtAvail.court.price_per_hour)}/hr
                        </p>
                      </div>
                      <Badge variant={courtAvail.available_slots_count > 0 ? 'success' : 'secondary'}>
                        {courtAvail.available_slots_count} {isJa ? '枠空き' : 'available'}
                      </Badge>
                    </div>

                    <TimeSlotGrid
                      slots={courtAvail.slots}
                      selectedSlot={selectedCourt?.id === courtAvail.court.id ? selectedSlot : null}
                      onSlotSelect={(slot) => handleSlotSelect(courtAvail.court, slot)}
                      pricePerHour={courtAvail.court.price_per_hour}
                    />
                  </div>
                ))}

                {/* Booking Button */}
                {selectedSlot && selectedCourt && (
                  <div className="sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{isJa ? selectedCourt.name_ja : selectedCourt.name_en}</p>
                        <p className="text-sm text-gray-600">
                          {selectedSlot.start_time} - {selectedSlot.end_time}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-blue-600">
                          {formatPrice(selectedSlot.price)}
                        </span>
                        <Button onClick={handleProceedToBooking}>
                          {isJa ? '予約に進む' : 'Proceed to Book'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {isJa ? 'この日は予約可能な枠がありません' : 'No available slots for this date'}
              </div>
            )}
          </Card>
        )}

        {/* Not bookable notice */}
        {!venue.is_bookable && (
          <Card className="p-6 bg-gray-50">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isJa ? 'オンライン予約は利用できません' : 'Online booking not available'}
              </h3>
              <p className="text-gray-600">
                {isJa
                  ? 'この施設は直接予約してください'
                  : 'Please contact this venue directly to make a reservation'}
              </p>
              {venue.phone && (
                <a href={`tel:${venue.phone}`} className="mt-4 inline-block">
                  <Button>{isJa ? '電話する' : 'Call Venue'}</Button>
                </a>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
