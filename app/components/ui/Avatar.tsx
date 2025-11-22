import { cn } from '@/lib/utils';
import Image from 'next/image';

interface AvatarProps {
    src?: string;
    alt?: string;
    initials?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    status?: 'online' | 'offline' | 'away' | 'busy';
    className?: string;
}

const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
};

// Pixel sizes for next/image (must match sizeClasses)
const sizePixels = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    '2xl': 80,
};

const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
};

export default function Avatar({
    src,
    alt = 'Avatar',
    initials,
    size = 'md',
    status,
    className,
}: AvatarProps) {
    const sizeClass = sizeClasses[size];
    const pixelSize = sizePixels[size];
    const statusSize = size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';

    return (
        <div className={cn('relative inline-block', className)}>
            {src ? (
                <Image
                    src={src}
                    alt={alt}
                    width={pixelSize}
                    height={pixelSize}
                    className={cn(
                        'rounded-full object-cover ring-2 ring-white',
                        sizeClass
                    )}
                    loading="lazy"
                    unoptimized={src.startsWith('data:') || src.includes('dicebear')}
                />
            ) : (
                <div
                    className={cn(
                        'rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold ring-2 ring-white',
                        sizeClass
                    )}
                >
                    {initials || alt.charAt(0).toUpperCase()}
                </div>
            )}
            {status && (
                <span
                    className={cn(
                        'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
                        statusColors[status],
                        statusSize
                    )}
                />
            )}
        </div>
    );
}

interface AvatarGroupProps {
    avatars: Array<{ src?: string; alt?: string; initials?: string }>;
    max?: number;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    className?: string;
}

export function AvatarGroup({
    avatars,
    max = 5,
    size = 'md',
    className,
}: AvatarGroupProps) {
    const displayAvatars = avatars.slice(0, max);
    const remaining = Math.max(0, avatars.length - max);

    return (
        <div className={cn('flex -space-x-2', className)}>
            {displayAvatars.map((avatar, index) => (
                <Avatar
                    key={index}
                    {...avatar}
                    size={size}
                    className="hover:z-10 transition-transform hover:scale-110"
                />
            ))}
            {remaining > 0 && (
                <div
                    className={cn(
                        'rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium ring-2 ring-white',
                        sizeClasses[size]
                    )}
                >
                    +{remaining}
                </div>
            )}
        </div>
    );
}
