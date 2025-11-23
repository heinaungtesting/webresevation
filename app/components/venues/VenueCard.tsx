'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Card } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';

interface VenueCardProps {
  venue: {
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
  };
}

export function VenueCard({ venue }: VenueCardProps) {
  const locale = useLocale();
  const isJa = locale === 'ja';

  const name = isJa ? venue.name_ja : venue.name_en;
  const address = isJa ? venue.address_ja : venue.address_en;
  const station = isJa ? venue.station_ja : venue.station_en;

  const formatPrice = (price: number) => `¥${price.toLocaleString()}`;

  return (
    <Link href={`/${locale}/venues/${venue.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
        {/* Image */}
        <div className="h-40 bg-gray-200 relative">
          {venue.image_url ? (
            <img
              src={venue.image_url}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
              <svg className="w-12 h-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          )}
          {/* Courts count badge */}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-white/90">
              {venue.courts_count} {venue.courts_count === 1 ? 'Court' : 'Courts'}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-900 mb-1">{name}</h3>

          {station && (
            <p className="text-sm text-gray-500 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {station}
            </p>
          )}

          <p className="text-sm text-gray-600 mb-3 line-clamp-1">{address}</p>

          {/* Sport types */}
          <div className="flex flex-wrap gap-1 mb-3">
            {venue.sport_types.slice(0, 3).map((sport) => (
              <Badge key={sport} variant="outline" className="text-xs capitalize">
                {sport}
              </Badge>
            ))}
            {venue.sport_types.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{venue.sport_types.length - 3}
              </Badge>
            )}
          </div>

          {/* Price range */}
          {venue.min_price !== null && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {isJa ? '料金' : 'Price'}
              </span>
              <span className="font-semibold text-blue-600">
                {venue.min_price === venue.max_price
                  ? formatPrice(venue.min_price)
                  : `${formatPrice(venue.min_price)} - ${formatPrice(venue.max_price!)}`}
                <span className="text-xs text-gray-500 font-normal">/hr</span>
              </span>
            </div>
          )}

          {/* Amenities preview */}
          {venue.amenities.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {venue.amenities.slice(0, 4).map((amenity, index) => (
                  <span key={index} className="text-xs text-gray-500">
                    {isJa ? amenity.name_ja : amenity.name_en}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
