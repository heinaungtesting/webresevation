import Link from 'next/link';
import { Session, SportType, SkillLevel } from '@/types';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { formatDate, formatTime } from '@/lib/utils';
import { Users, Clock, MapPin } from 'lucide-react';

interface SessionCardProps {
  session: Session;
}

const sportIcons: Record<SportType, string> = {
  badminton: '🏸',
  basketball: '🏀',
  volleyball: '🏐',
  tennis: '🎾',
  soccer: '⚽',
  futsal: '⚽',
  'table-tennis': '🏓',
  other: '🏃',
};

const skillColors: Record<SkillLevel, 'success' | 'warning' | 'info'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'info',
};

export default function SessionCard({ session }: SessionCardProps) {
  const sportIcon = sportIcons[session.sport_type] || '🏃';
  const isFull = Boolean(session.max_participants && session.current_participants >= session.max_participants);

  return (
    <Card hoverable variant="elevated" className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-3xl">{sportIcon}</span>
          <div>
            <h3 className="font-semibold text-lg capitalize">
              {session.sport_type.replace('-', ' ')}
            </h3>
            <Badge variant={skillColors[session.skill_level]} size="sm">
              {session.skill_level}
            </Badge>
          </div>
        </div>
        {isFull && (
          <Badge variant="danger" size="sm">
            Full
          </Badge>
        )}
      </div>

      <div className="space-y-2 mb-4 flex-grow">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span className="line-clamp-1">
            {session.sport_center?.name_en || 'Sport Center'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{formatDate(session.date_time)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>
            {session.current_participants}
            {session.max_participants && ` / ${session.max_participants}`} going
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Link href={`/sessions/${session.id}`} className="flex-grow">
          <Button variant="outline" fullWidth size="sm">
            View Details
          </Button>
        </Link>
        <Button
          variant="primary"
          size="sm"
          disabled={isFull}
          className="flex-grow"
        >
          {isFull ? 'Full' : "I'm Going!"}
        </Button>
      </div>
    </Card>
  );
}
