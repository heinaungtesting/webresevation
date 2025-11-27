'use client';

import Link from 'next/link';
import { Session, SportType } from '@/types';
import Badge from './ui/Badge';
import { formatTime } from '@/lib/utils';
import { Users, Clock, MapPin } from 'lucide-react';
import { AvatarGroup } from './ui/Avatar';
import { useState, useEffect } from 'react';

interface CompactSessionCardProps {
  session: Session;
  variant?: 'horizontal' | 'vertical';
  className?: string;
}

const sportConfig: Record<SportType, { icon: string; gradient: string }> = {
  badminton: { icon: '🏸', gradient: 'from-emerald-500 to-teal-500' },
  basketball: { icon: '🏀', gradient: 'from-orange-500 to-amber-500' },
  volleyball: { icon: '🏐', gradient: 'from-yellow-500 to-orange-500' },
  tennis: { icon: '🎾', gradient: 'from-green-500 to-emerald-500' },
  soccer: { icon: '⚽', gradient: 'from-blue-500 to-indigo-500' },
  futsal: { icon: '⚽', gradient: 'from-violet-500 to-purple-500' },
  'table-tennis': { icon: '🏓', gradient: 'from-red-500 to-pink-500' },
  other: { icon: '🏃', gradient: 'from-slate-500 to-slate-600' },
};

export default function CompactSessionCard({ session, variant = 'horizontal', className = '' }: CompactSessionCardProps) {
  const sport = sportConfig[session.sport_type] || sportConfig.other;
  const isFull = Boolean(session.max_participants && session.current_participants >= session.max_participants);

  // Calculate spots left
  const spotsLeft = session.max_participants
    ? session.max_participants - session.current_participants
    : null;

  // Use state for time-dependent calculations to avoid hydration mismatch
  const [timeLabel, setTimeLabel] = useState(formatTime(session.date_time));
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    // Calculate time until session (client-side only)
    const updateTimeLabel = () => {
      const sessionDate = new Date(session.date_time);
      const now = new Date();
      const diffMs = sessionDate.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);

      let label = '';
      if (diffMins < 0) {
        label = 'Started';
        setIsUrgent(false);
      } else if (diffMins < 60) {
        label = `${diffMins}m`;
        setIsUrgent(true);
      } else if (diffHours < 3) {
        label = `${diffHours}h ${diffMins % 60}m`;
        setIsUrgent(true);
      } else {
        label = formatTime(session.date_time);
        setIsUrgent(false);
      }
      setTimeLabel(label);
    };

    updateTimeLabel();
    // Update every minute
    const interval = setInterval(updateTimeLabel, 60000);
    return () => clearInterval(interval);
  }, [session.date_time]);


  return (
    <Link href={`/sessions/${session.id}`} className={`block h-full ${className}`}>
      <div className="group relative h-full flex flex-col p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 min-w-[280px]">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${sport.gradient} text-lg shadow-sm text-white`}>
              {sport.icon}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900 capitalize truncate max-w-[120px]">
                {session.sport_type.replace('-', ' ')}
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className={`text-xs font-medium ${isUrgent ? 'text-rose-500' : 'text-slate-500'
                  }`}>
                  {timeLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          {isFull ? (
            <Badge variant="danger" size="sm" className="shadow-sm">Full</Badge>
          ) : spotsLeft && spotsLeft <= 3 ? (
            <Badge variant="warning" size="sm" className="shadow-sm">{spotsLeft} left</Badge>
          ) : (
            <Badge variant="success" size="sm" className="shadow-sm">Open</Badge>
          )}
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4 flex-grow">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-xs font-medium text-slate-600 truncate">
              {session.sport_center?.name_en || 'Sport Center'}
            </span>
          </div>

          {/* Participants with Avatars */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {session.current_participants > 0 ? (
                <AvatarGroup
                  avatars={Array.from({ length: Math.min(session.current_participants, 3) }, (_, i) => ({
                    initials: String.fromCharCode(65 + i),
                  }))}
                  max={3}
                  size="xs"
                />
              ) : (
                <span className="text-xs text-slate-400">Be the first to join</span>
              )}
            </div>
            <div className="text-xs font-semibold text-slate-600">
              {session.current_participants}
              <span className="text-slate-400 font-normal">
                {session.max_participants ? `/${session.max_participants}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {session.max_participants && (
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isFull
                ? 'bg-rose-500'
                : spotsLeft && spotsLeft <= 3
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
                }`}
              style={{ width: `${Math.min((session.current_participants / session.max_participants) * 100, 100)}%` }}
            />
          </div>
        )}

        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5 group-hover:ring-primary-500/20 transition-all duration-200 pointer-events-none" />
      </div>
    </Link>
  );
}
