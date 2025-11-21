'use client';

import { cn } from '@/lib/utils';
import { Flame, Coffee, GraduationCap, Languages, Trophy, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export type SessionVibe = 'COMPETITIVE' | 'CASUAL' | 'ACADEMY' | 'LANGUAGE_EXCHANGE';

interface VibeBadgeProps {
  vibe: SessionVibe;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

// Vibe configuration with gradients, icons, and labels
const VIBE_CONFIG: Record<SessionVibe, {
  label: string;
  shortLabel: string;
  emoji: string;
  icon: typeof Flame;
  gradient: string;
  textColor: string;
  shadowColor: string;
}> = {
  COMPETITIVE: {
    label: 'Competitive',
    shortLabel: 'Comp',
    emoji: '\uD83C\uDFC6',
    icon: Trophy,
    gradient: 'bg-gradient-to-r from-red-500 via-orange-500 to-amber-500',
    textColor: 'text-white',
    shadowColor: 'shadow-orange-500/30',
  },
  CASUAL: {
    label: 'Casual',
    shortLabel: 'Chill',
    emoji: '\u2615',
    icon: Coffee,
    gradient: 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400',
    textColor: 'text-white',
    shadowColor: 'shadow-teal-500/30',
  },
  ACADEMY: {
    label: 'Academy',
    shortLabel: 'Learn',
    emoji: '\uD83C\uDF93',
    icon: GraduationCap,
    gradient: 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500',
    textColor: 'text-white',
    shadowColor: 'shadow-purple-500/30',
  },
  LANGUAGE_EXCHANGE: {
    label: 'Language Exchange',
    shortLabel: 'Lang',
    emoji: '\uD83D\uDDE3\uFE0F',
    icon: MessageCircle,
    gradient: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500',
    textColor: 'text-white',
    shadowColor: 'shadow-indigo-500/30',
  },
};

const SIZES = {
  sm: {
    badge: 'px-2 py-0.5 text-xs gap-1',
    icon: 'w-3 h-3',
    emoji: 'text-xs',
  },
  md: {
    badge: 'px-2.5 py-1 text-sm gap-1.5',
    icon: 'w-4 h-4',
    emoji: 'text-sm',
  },
  lg: {
    badge: 'px-3 py-1.5 text-base gap-2',
    icon: 'w-5 h-5',
    emoji: 'text-base',
  },
};

export default function VibeBadge({
  vibe,
  size = 'md',
  showLabel = true,
  animated = true,
  className,
}: VibeBadgeProps) {
  const config = VIBE_CONFIG[vibe];
  const sizeConfig = SIZES[size];

  const badgeContent = (
    <>
      <span className={sizeConfig.emoji}>{config.emoji}</span>
      {showLabel && (
        <span className="font-semibold tracking-tight">
          {size === 'sm' ? config.shortLabel : config.label}
        </span>
      )}
    </>
  );

  const baseClasses = cn(
    'inline-flex items-center font-medium rounded-full',
    config.gradient,
    config.textColor,
    sizeConfig.badge,
    'shadow-md',
    config.shadowColor,
    className
  );

  if (animated) {
    return (
      <motion.span
        className={baseClasses}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {badgeContent}
      </motion.span>
    );
  }

  return (
    <span className={baseClasses}>
      {badgeContent}
    </span>
  );
}

// Minimal version for tight spaces (icon only with tooltip)
export function VibeBadgeCompact({
  vibe,
  className,
}: {
  vibe: SessionVibe;
  className?: string;
}) {
  const config = VIBE_CONFIG[vibe];

  return (
    <motion.span
      className={cn(
        'inline-flex items-center justify-center w-6 h-6 rounded-full text-sm',
        config.gradient,
        'shadow-sm',
        config.shadowColor,
        className
      )}
      title={config.label}
      whileHover={{ scale: 1.1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {config.emoji}
    </motion.span>
  );
}

// Export helper function for vibe options
export function getVibeOptions(): Array<{ value: SessionVibe; label: string; emoji: string }> {
  return Object.entries(VIBE_CONFIG).map(([value, config]) => ({
    value: value as SessionVibe,
    label: config.label,
    emoji: config.emoji,
  }));
}

// Export config for external use
export { VIBE_CONFIG };
