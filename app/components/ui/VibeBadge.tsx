import { cn } from '@/lib/utils';
import { Flame, Coffee, GraduationCap, Languages } from 'lucide-react';

export type SessionVibe = 'COMPETITIVE' | 'CASUAL' | 'ACADEMY' | 'LANGUAGE_EXCHANGE';

interface VibeBadgeProps {
  vibe: SessionVibe;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

// Vibe configuration with colors, icons, and labels
const VIBE_CONFIG: Record<SessionVibe, {
  label: string;
  shortLabel: string;
  icon: typeof Flame;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  COMPETITIVE: {
    label: 'Competitive',
    shortLabel: 'Comp',
    icon: Flame,
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
  CASUAL: {
    label: 'Casual',
    shortLabel: 'Casual',
    icon: Coffee,
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  ACADEMY: {
    label: 'Academy',
    shortLabel: 'Learn',
    icon: GraduationCap,
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
  },
  LANGUAGE_EXCHANGE: {
    label: 'Language Exchange',
    shortLabel: 'Lang',
    icon: Languages,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
};

const SIZES = {
  sm: {
    badge: 'px-1.5 py-0.5 text-xs gap-1',
    icon: 'w-3 h-3',
  },
  md: {
    badge: 'px-2 py-1 text-sm gap-1.5',
    icon: 'w-4 h-4',
  },
  lg: {
    badge: 'px-3 py-1.5 text-base gap-2',
    icon: 'w-5 h-5',
  },
};

export default function VibeBadge({
  vibe,
  size = 'md',
  showLabel = true,
  className,
}: VibeBadgeProps) {
  const config = VIBE_CONFIG[vibe];
  const sizeConfig = SIZES[size];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeConfig.badge,
        className
      )}
    >
      <Icon className={sizeConfig.icon} />
      {showLabel && (
        <span>{size === 'sm' ? config.shortLabel : config.label}</span>
      )}
    </span>
  );
}

// Export helper function for vibe options
export function getVibeOptions(): Array<{ value: SessionVibe; label: string; icon: typeof Flame }> {
  return Object.entries(VIBE_CONFIG).map(([value, config]) => ({
    value: value as SessionVibe,
    label: config.label,
    icon: config.icon,
  }));
}
