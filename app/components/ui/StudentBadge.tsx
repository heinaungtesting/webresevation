'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StudentBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  animated?: boolean;
}

/**
 * StudentBadge - Shows a verified student badge
 *
 * Displays a graduation cap emoji with optional "Verified Student" label.
 * The badge indicates the user has been verified as a university student.
 */
export default function StudentBadge({
  size = 'md',
  showLabel = false,
  className,
  animated = true,
}: StudentBadgeProps) {
  const sizes = {
    sm: {
      container: 'text-xs gap-1',
      icon: 'text-sm',
      padding: showLabel ? 'px-1.5 py-0.5' : 'px-1 py-0.5',
    },
    md: {
      container: 'text-sm gap-1.5',
      icon: 'text-base',
      padding: showLabel ? 'px-2 py-1' : 'px-1.5 py-1',
    },
    lg: {
      container: 'text-base gap-2',
      icon: 'text-lg',
      padding: showLabel ? 'px-3 py-1.5' : 'px-2 py-1.5',
    },
  };

  const sizeConfig = sizes[size];

  const badge = (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500',
        'text-amber-900 shadow-sm',
        sizeConfig.container,
        sizeConfig.padding,
        className
      )}
      title="Verified Student"
    >
      <span className={sizeConfig.icon} role="img" aria-label="Verified Student">
        🎓
      </span>
      {showLabel && <span>Student</span>}
    </span>
  );

  if (animated) {
    return (
      <motion.span
        className="inline-flex"
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {badge}
      </motion.span>
    );
  }

  return badge;
}

/**
 * Inline version for use in text/titles
 */
export function StudentBadgeInline({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center', className)}
      title="Verified Student"
    >
      <span role="img" aria-label="Verified Student">
        🎓
      </span>
    </span>
  );
}
