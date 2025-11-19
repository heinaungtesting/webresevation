import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger' | 'primary' | 'secondary';
  size?: 'xs' | 'sm' | 'md';
  outline?: boolean;
  dot?: boolean;
}

export default function Badge({
  className,
  variant = 'default',
  size = 'md',
  outline = false,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const baseStyles = cn(
    'inline-flex items-center font-medium rounded-full',
    'transition-colors duration-200'
  );

  const variants = {
    default: outline
      ? 'border border-slate-300 text-slate-700 bg-white'
      : 'bg-slate-100 text-slate-700',
    success: outline
      ? 'border border-emerald-300 text-emerald-700 bg-emerald-50'
      : 'bg-emerald-100 text-emerald-700',
    warning: outline
      ? 'border border-amber-300 text-amber-700 bg-amber-50'
      : 'bg-amber-100 text-amber-700',
    info: outline
      ? 'border border-blue-300 text-blue-700 bg-blue-50'
      : 'bg-blue-100 text-blue-700',
    danger: outline
      ? 'border border-red-300 text-red-700 bg-red-50'
      : 'bg-red-100 text-red-700',
    primary: outline
      ? 'border border-primary-300 text-primary-700 bg-primary-50'
      : 'bg-primary-100 text-primary-700',
    secondary: outline
      ? 'border border-violet-300 text-violet-700 bg-violet-50'
      : 'bg-violet-100 text-violet-700',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  const dotColors = {
    default: 'bg-slate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
    danger: 'bg-red-500',
    primary: 'bg-primary-500',
    secondary: 'bg-violet-500',
  };

  return (
    <span
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full mr-1.5',
          dotColors[variant]
        )} />
      )}
      {children}
    </span>
  );
}
