import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'avatar' | 'card';
  width?: string;
  height?: string;
}

export default function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const baseClasses = 'relative overflow-hidden bg-slate-200';

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    avatar: 'rounded-full w-10 h-10',
    card: 'rounded-2xl h-64',
  };

  const style = {
    width: width || undefined,
    height: height || undefined,
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </div>
  );
}

// Enhanced Skeleton for Session Card
export function SessionCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Skeleton variant="rectangular" width="44px" height="44px" className="rounded-xl" />
          <div>
            <Skeleton variant="text" width="100px" className="mb-1.5" />
            <Skeleton variant="text" width="70px" height="20px" />
          </div>
        </div>
        <Skeleton variant="rectangular" width="60px" height="24px" className="rounded-full" />
      </div>

      <div className="space-y-2.5 mb-4">
        <div className="flex items-center gap-2.5">
          <Skeleton variant="rectangular" width="28px" height="28px" className="rounded-lg" />
          <Skeleton variant="text" width="70%" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton variant="rectangular" width="28px" height="28px" className="rounded-lg" />
          <Skeleton variant="text" width="60%" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton variant="rectangular" width="28px" height="28px" className="rounded-lg" />
          <Skeleton variant="text" width="50%" />
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-slate-100">
        <Skeleton variant="rectangular" width="50%" height="44px" className="rounded-xl" />
        <Skeleton variant="rectangular" width="50%" height="44px" className="rounded-xl" />
      </div>
    </div>
  );
}

// Skeleton for Profile Section
export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton variant="circular" width="64px" height="64px" />
      <div className="flex-1">
        <Skeleton variant="text" width="150px" className="mb-2" />
        <Skeleton variant="text" width="200px" />
      </div>
    </div>
  );
}

// Skeleton for Compact Session Card
export function CompactSessionCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-soft border border-slate-100 p-4 w-80">
      <div className="flex gap-3">
        <Skeleton variant="rectangular" width="80px" height="80px" className="rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <Skeleton variant="text" width="60%" className="mb-2" />
          <Skeleton variant="text" width="80%" className="mb-1.5" />
          <Skeleton variant="text" width="50%" />
        </div>
      </div>
    </div>
  );
}

// Skeleton for Avatar
export function AvatarSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return <Skeleton variant="circular" className={sizes[size]} />;
}
