'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import { Session } from '@/types';
import CompactSessionCard from './CompactSessionCard';
import { MapPin, AlertCircle } from 'lucide-react';

interface SessionMapProps {
  sessions: Session[];
  height?: string; // e.g., "400px", "60vh"
  showLegend?: boolean; // Show sport legend
  className?: string;
}

// Tokyo center coordinates
const TOKYO_CENTER = { lat: 35.6895, lng: 139.6917 };
const DEFAULT_ZOOM = 12;

// Zoom level thresholds based on coordinate span (in degrees)
// Larger span = lower zoom to fit all markers
const ZOOM_THRESHOLDS = [
  { maxSpan: 0.5, zoom: 9 },
  { maxSpan: 0.2, zoom: 10 },
  { maxSpan: 0.1, zoom: 11 },
  { maxSpan: 0.05, zoom: 12 },
  { maxSpan: 0.02, zoom: 13 },
  { maxSpan: 0.01, zoom: 14 },
  { maxSpan: 0, zoom: 15 }, // Fallback for very close markers
];

// Sport type to pin color mapping
const sportPinColors: Record<string, { background: string; glyph: string; border: string }> = {
  badminton: { background: '#10B981', glyph: '#fff', border: '#059669' },
  basketball: { background: '#F97316', glyph: '#fff', border: '#EA580C' },
  volleyball: { background: '#EAB308', glyph: '#fff', border: '#CA8A04' },
  tennis: { background: '#22C55E', glyph: '#fff', border: '#16A34A' },
  soccer: { background: '#3B82F6', glyph: '#fff', border: '#2563EB' },
  futsal: { background: '#8B5CF6', glyph: '#fff', border: '#7C3AED' },
  'table-tennis': { background: '#EF4444', glyph: '#fff', border: '#DC2626' },
  other: { background: '#64748B', glyph: '#fff', border: '#475569' },
};

// Sport type emoji mapping
const sportEmoji: Record<string, string> = {
  badminton: '🏸',
  basketball: '🏀',
  volleyball: '🏐',
  tennis: '🎾',
  soccer: '⚽',
  futsal: '⚽',
  'table-tennis': '🏓',
  other: '🏃',
};

interface MarkerData {
  session: Session;
  position: { lat: number; lng: number };
}

export default function SessionMap({
  sessions,
  height = '60vh',
  showLegend = true,
  className = ''
}: SessionMapProps) {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Filter sessions with valid coordinates and memoize
  const markersData = useMemo((): MarkerData[] => {
    return sessions
      .filter(
        (session) =>
          session.sport_center?.latitude != null &&
          session.sport_center?.longitude != null
      )
      .map((session) => ({
        session,
        position: {
          lat: session.sport_center!.latitude!,
          lng: session.sport_center!.longitude!,
        },
      }));
  }, [sessions]);

  // Calculate map center and zoom based on markers
  const { center, zoom } = useMemo(() => {
    if (markersData.length === 0) {
      // No markers: use default Tokyo center
      return {
        center: TOKYO_CENTER,
        zoom: DEFAULT_ZOOM,
      };
    }

    if (markersData.length === 1) {
      // Single marker: center on it with higher zoom
      return {
        center: markersData[0].position,
        zoom: 15,
      };
    }

    // Multiple markers: calculate center and bounds
    const bounds = {
      north: Math.max(...markersData.map((m) => m.position.lat)),
      south: Math.min(...markersData.map((m) => m.position.lat)),
      east: Math.max(...markersData.map((m) => m.position.lng)),
      west: Math.min(...markersData.map((m) => m.position.lng)),
    };

    // Calculate center point
    const calculatedCenter = {
      lat: (bounds.north + bounds.south) / 2,
      lng: (bounds.east + bounds.west) / 2,
    };

    // Calculate zoom level based on the span of coordinates
    // The zoom level is inversely related to the span
    const latSpan = bounds.north - bounds.south;
    const lngSpan = bounds.east - bounds.west;
    const maxSpan = Math.max(latSpan, lngSpan);

    // Determine zoom level based on coordinate span
    // Find the first threshold where maxSpan exceeds the threshold value
    const calculatedZoom =
      ZOOM_THRESHOLDS.find((threshold) => maxSpan > threshold.maxSpan)?.zoom ||
      DEFAULT_ZOOM;

    return {
      center: calculatedCenter,
      zoom: calculatedZoom,
    };
  }, [markersData]);

  // Handle marker click
  const handleMarkerClick = useCallback((sessionId: string) => {
    setSelectedMarker((prev) => (prev === sessionId ? null : sessionId));
  }, []);

  // Close info window
  const handleInfoWindowClose = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  // Error state: No API key
  if (!apiKey) {
    return (
      <div className={`w-full rounded-3xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Map Not Available</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            Google Maps API key is not configured. Please add{' '}
            <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs">
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
            </code>{' '}
            to your environment variables.
          </p>
        </div>
      </div>
    );
  }

  // Empty state: No sessions with coordinates
  if (markersData.length === 0) {
    return (
      <div className={`w-full rounded-3xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Sessions on Map</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            No sessions with location data available. Try adjusting your filters or check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full rounded-3xl overflow-hidden shadow-lg border border-slate-200 relative ${className}`} style={{ height }}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapId="sportsmatch-session-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={true}
          className="w-full h-full"
        >
          {markersData.map(({ session, position }) => {
            const pinColors = sportPinColors[session.sport_type] || sportPinColors.other;
            const emoji = sportEmoji[session.sport_type] || sportEmoji.other;
            const isSelected = selectedMarker === session.id;

            return (
              <AdvancedMarker
                key={session.id}
                position={position}
                onClick={() => handleMarkerClick(session.id)}
                title={`${session.sport_type} at ${session.sport_center?.name_en || 'Unknown'}`}
              >
                <Pin
                  background={pinColors.background}
                  glyphColor={pinColors.glyph}
                  borderColor={pinColors.border}
                  scale={isSelected ? 1.3 : 1}
                >
                  <span className="text-sm">{emoji}</span>
                </Pin>
              </AdvancedMarker>
            );
          })}

          {/* Info Window for selected marker */}
          {selectedMarker && (() => {
            const markerData = markersData.find((m) => m.session.id === selectedMarker);
            if (!markerData) return null;

            return (
              <InfoWindow
                position={markerData.position}
                onCloseClick={handleInfoWindowClose}
                pixelOffset={[0, -40]}
              >
                <div className="min-w-[280px] max-w-[320px] p-1">
                  <CompactSessionCard
                    session={markerData.session}
                    variant="vertical"
                  />
                </div>
              </InfoWindow>
            );
          })()}
        </Map>
      </APIProvider>

      {/* Legend - only show for multiple sessions */}
      {showLegend && markersData.length > 1 && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 border border-slate-200">
          <p className="text-xs font-semibold text-slate-700 mb-2">Sessions by Sport</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(sportEmoji).slice(0, 6).map(([sport, emoji]) => (
              <div
                key={sport}
                className="flex items-center gap-1 text-xs text-slate-600"
              >
                <span>{emoji}</span>
                <span className="capitalize">{sport.replace('-', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
