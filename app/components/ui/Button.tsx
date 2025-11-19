import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient' | 'glass' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth = false, loading = false, children, disabled, ...props }, ref) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center font-medium rounded-xl',
      'transition-all duration-300 ease-out',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
      'active:scale-[0.98] touch-manipulation',
      'relative overflow-hidden'
    );

    const variants = {
      primary: cn(
        'bg-primary-600 text-white',
        'hover:bg-primary-700 hover:shadow-medium hover:-translate-y-0.5',
        'active:bg-primary-800',
        'focus-visible:ring-primary-500',
        'shadow-soft'
      ),
      secondary: cn(
        'bg-slate-800 text-white',
        'hover:bg-slate-900 hover:shadow-medium hover:-translate-y-0.5',
        'active:bg-slate-950',
        'focus-visible:ring-slate-500',
        'shadow-soft'
      ),
      outline: cn(
        'border-2 border-primary-500 text-primary-600 bg-transparent',
        'hover:bg-primary-50 hover:border-primary-600 hover:-translate-y-0.5',
        'active:bg-primary-100',
        'focus-visible:ring-primary-500'
      ),
      ghost: cn(
        'text-slate-700 bg-transparent',
        'hover:bg-slate-100 hover:text-slate-900',
        'active:bg-slate-200',
        'focus-visible:ring-slate-500'
      ),
      danger: cn(
        'bg-red-600 text-white',
        'hover:bg-red-700 hover:shadow-medium hover:-translate-y-0.5',
        'active:bg-red-800',
        'focus-visible:ring-red-500',
        'shadow-soft'
      ),
      gradient: cn(
        'bg-gradient-ocean text-white',
        'hover:shadow-glow hover:-translate-y-0.5',
        'active:shadow-glow-sm',
        'focus-visible:ring-primary-500',
        'shadow-colored',
        'before:absolute before:inset-0',
        'before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0',
        'before:translate-x-[-200%] hover:before:translate-x-[200%]',
        'before:transition-transform before:duration-700'
      ),
      glass: cn(
        'glass-light text-slate-800',
        'hover:bg-white/70 hover:-translate-y-0.5 hover:shadow-soft',
        'active:bg-white/80',
        'focus-visible:ring-white/50',
        'border border-white/30'
      ),
      glow: cn(
        'bg-primary-600 text-white',
        'hover:shadow-glow-lg hover:-translate-y-0.5',
        'active:shadow-glow',
        'focus-visible:ring-primary-500',
        'shadow-glow animate-pulse-glow'
      ),
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm min-h-[36px] gap-1.5',
      md: 'px-5 py-2.5 text-base min-h-[44px] gap-2',
      lg: 'px-7 py-3.5 text-lg min-h-[52px] gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
