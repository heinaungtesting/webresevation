import Link from 'next/link';
import { Session, SportType, SkillLevel } from '@/types';
import Badge from './ui/Badge';
import Button from './ui/Button';
import FavoriteButton from './sessions/FavoriteButton';
import { formatDate, formatTime } from '@/lib/utils';
import { Users, Clock, MapPin, ArrowRight } from 'lucide-react';
import { AvatarGroup } from './ui/Avatar';

interface SessionCardProps {
  session: Session;
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

const skillConfig: Record<SkillLevel, { color: 'success' | 'warning' | 'info'; label: string }> = {
  beginner: { color: 'success', label: 'Beginner' },
  intermediate: { color: 'warning', label: 'Intermediate' },
  advanced: { color: 'info', label: 'Advanced' },
};

export default function SessionCard({ session }: SessionCardProps) {
  const sport = sportConfig[session.sport_type] || sportConfig.other;
  const skill = skillConfig[session.skill_level];
  const isFull = Boolean(session.max_participants && session.current_participants >= session.max_participants);

  // Calculate participation percentage
  const participationPercent = session.max_participants
    ? (session.current_participants / session.max_participants) * 100
    : 0;

  // Calculate spots left for urgency
  const spotsLeft = session.max_participants
    ? session.max_participants - session.current_participants
    : null;

  return (
    <div className="group relative h-full">
      {/* Card */}
      <div className="relative h-full flex flex-col p-4 sm:p-5 rounded-2xl bg-white border border-slate-100 shadow-soft hover:shadow-large hover:-translate-y-1 transition-all duration-300">
        {/* Sport badge with gradient background */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${sport.gradient} text-xl sm:text-2xl shadow-soft`}>
              {sport.icon}
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-900 capitalize">
                {session.sport_type.replace('-', ' ')}
              </h3>
              <Badge variant={skill.color} size="sm">
                {skill.label}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isFull ? (
              <Badge variant="danger" size="sm" className="animate-pulse">
                Full
              </Badge>
            ) : spotsLeft && spotsLeft <= 3 ? (
              <Badge variant="warning" size="sm" className="text-amber-700 bg-amber-50 border-amber-200">
                {spotsLeft === 1 ? '1 spot left!' : `${spotsLeft} spots left`}
              </Badge>
            ) : null}
            <FavoriteButton sessionId={session.id} size="sm" />
          </div>
        </div>

        {/* Session details */}
        <div className="space-y-2.5 mb-4 flex-grow">
          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <span className="line-clamp-1 font-medium text-sm">
              {session.sport_center?.name_en || 'Sport Center'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <span className="font-medium text-sm">{formatDate(session.date_time)}</span>
          </div>

          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100">
              <Users className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">
                  {session.current_participants}
                  {session.max_participants && ` / ${session.max_participants}`} going
                </span>
                {session.max_participants && (
                  <span className="text-xs text-slate-500">
                    {Math.round(participationPercent)}%
                  </span>
                )}
              </div>
              {/* Progress bar */}
              {session.max_participants && (
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isFull
                      ? 'bg-red-500'
                      : participationPercent >= 75
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                      }`}
                    style={{ width: `${Math.min(participationPercent, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Participant Avatars Preview */}
          {session.current_participants > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <AvatarGroup
                avatars={Array.from({ length: Math.min(session.current_participants, 5) }, (_, i) => ({
                  initials: String.fromCharCode(65 + i),
                }))}
                max={4}
                size="sm"
              />
              {session.current_participants > 4 && (
                <span className="text-xs text-slate-500 ml-1">
                  and {session.current_participants - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <Link href={`/sessions/${session.id}`} className="flex-1">
            <Button variant="outline" fullWidth size="sm" className="group/btn min-h-[44px]">
              Details
              <ArrowRight className="w-3.5 h-3.5 ml-1 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all" />
            </Button>
          </Link>
          <Button
            variant={isFull ? 'ghost' : 'gradient'}
            size="sm"
            disabled={isFull}
            className="flex-1 min-h-[44px]"
          >
            {isFull ? 'Full' : "Join"}
          </Button>
        </div>
      </div>

      {/* Decorative gradient border on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-violet/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl" />
    </div>
  );
}
