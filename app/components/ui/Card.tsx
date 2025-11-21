import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  elevation?: 'flat' | 'sm' | 'md' | 'lg' | 'floating';
  hoverable?: boolean;
  glow?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', elevation = 'sm', hoverable = false, glow = false, children, ...props }, ref) => {
    const baseStyles = cn(
      'rounded-2xl',
      'transition-all duration-300 ease-out'
    );

    const variants = {
      default: cn(
        'bg-white',
        'border border-slate-100',
        'shadow-soft'
      ),
      elevated: cn(
        'bg-white',
        'shadow-medium',
        hoverable && 'hover:shadow-large hover:-translate-y-1'
      ),
      outlined: cn(
        'bg-white',
        'border-2 border-slate-200',
        hoverable && 'hover:border-primary-200'
      ),
      glass: cn(
        'glass',
        hoverable && 'hover:bg-white/80'
      ),
      gradient: cn(
        'bg-gradient-to-br from-white to-slate-50',
        'border border-slate-100',
        'shadow-soft',
        hoverable && 'hover:shadow-medium hover:-translate-y-0.5'
      ),
    };

    const elevations = {
      flat: 'shadow-none',
      sm: 'shadow-soft',
      md: 'shadow-medium',
      lg: 'shadow-large',
      floating: 'shadow-elevated hover:shadow-2xl',
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
      xl: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          elevations[elevation],
          paddings[padding],
          hoverable && 'cursor-pointer',
          glow && 'hover-glow',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
