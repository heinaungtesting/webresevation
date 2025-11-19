import Link from 'next/link';
import { Session, SportType, SkillLevel } from '@/types';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { formatDate } from '@/lib/utils';
import { Users, Clock, MapPin, ArrowRight } from 'lucide-react';

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

  return (
    <div className="group relative h-full">
      {/* Card */}
      <div className="relative h-full flex flex-col p-6 rounded-2xl bg-white border border-slate-100 shadow-soft hover:shadow-large hover:-translate-y-1 transition-all duration-300">
        {/* Sport badge with gradient background */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${sport.gradient} text-2xl shadow-soft`}>
              {sport.icon}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-900 capitalize">
                {session.sport_type.replace('-', ' ')}
              </h3>
              <Badge variant={skill.color} size="sm">
                {skill.label}
              </Badge>
            </div>
          </div>
          {isFull && (
            <Badge variant="danger" size="sm" className="animate-pulse">
              Full
            </Badge>
          )}
        </div>

        {/* Session details */}
        <div className="space-y-3 mb-5 flex-grow">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100">
              <MapPin className="w-4 h-4 text-slate-500" />
            </div>
            <span className="line-clamp-1 font-medium">
              {session.sport_center?.name_en || 'Sport Center'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100">
              <Clock className="w-4 h-4 text-slate-500" />
            </div>
            <span className="font-medium">{formatDate(session.date_time)}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100">
              <Users className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">
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
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull
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
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <Link href={`/sessions/${session.id}`} className="flex-1">
            <Button variant="outline" fullWidth size="sm" className="group/btn">
              Details
              <ArrowRight className="w-3.5 h-3.5 ml-1 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all" />
            </Button>
          </Link>
          <Button
            variant={isFull ? 'ghost' : 'gradient'}
            size="sm"
            disabled={isFull}
            className="flex-1"
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
