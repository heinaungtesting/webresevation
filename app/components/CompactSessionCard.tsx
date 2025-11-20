import Link from 'next/link';
import { Session, SportType } from '@/types';
import Badge from './ui/Badge';
import { formatTime } from '@/lib/utils';
import { Users, Clock, MapPin } from 'lucide-react';

interface CompactSessionCardProps {
  session: Session;
  variant?: 'horizontal' | 'vertical';
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

export default function CompactSessionCard({ session, variant = 'horizontal' }: CompactSessionCardProps) {
  const sport = sportConfig[session.sport_type] || sportConfig.other;
  const isFull = Boolean(session.max_participants && session.current_participants >= session.max_participants);

  // Calculate spots left
  const spotsLeft = session.max_participants
    ? session.max_participants - session.current_participants
    : null;

  // Calculate time until session
  const sessionDate = new Date(session.date_time);
  const now = new Date();
  const diffMs = sessionDate.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);

  let timeLabel = '';
  if (diffMins < 0) {
    timeLabel = 'Started';
  } else if (diffMins < 60) {
    timeLabel = `${diffMins}m`;
  } else if (diffHours < 3) {
    timeLabel = `${diffHours}h ${diffMins % 60}m`;
  } else {
    timeLabel = formatTime(session.date_time);
  }

  return (
    <Link href={`/sessions/${session.id}`}>
      <div className="group relative h-full flex flex-col p-4 rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${sport.gradient} text-lg shadow-sm`}>
            {sport.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-slate-900 capitalize truncate">
              {session.sport_type.replace('-', ' ')}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className={`text-xs font-semibold uppercase tracking-wide ${
                diffMins < 60 ? 'text-accent-rose' : 'text-slate-500'
              }`}>
                {timeLabel}
              </span>
            </div>
          </div>
          {/* Status Badge */}
          {isFull ? (
            <Badge variant="danger" size="sm">Full</Badge>
          ) : spotsLeft && spotsLeft <= 3 ? (
            <Badge variant="warning" size="sm">{spotsLeft} left</Badge>
          ) : null}
        </div>

        {/* Details */}
        <div className="space-y-2 mb-3 flex-grow">
          <div className="flex items-center gap-2">
            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 truncate">
              {session.sport_center?.name_en || 'Sport Center'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {session.current_participants}
              {session.max_participants && ` / ${session.max_participants}`} players
            </span>
          </div>
        </div>

        {/* Progress bar */}
        {session.max_participants && (
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFull
                  ? 'bg-red-500'
                  : spotsLeft && spotsLeft <= 3
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min((session.current_participants / session.max_participants) * 100, 100)}%` }}
            />
          </div>
        )}

        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/5 to-accent-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
      </div>
    </Link>
  );
}
