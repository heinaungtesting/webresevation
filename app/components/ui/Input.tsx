import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, fullWidth = false, type = 'text', ...props }, ref) => {
    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label className="text-sm font-semibold text-slate-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'px-4 py-3 border-2 border-slate-200 rounded-xl text-base',
            'bg-white text-slate-900 placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'hover:border-slate-300',
            'disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-500',
            'transition-all duration-200',
            'min-h-[44px]', // Minimum touch target size for mobile
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            fullWidth && 'w-full',
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-sm text-red-600 font-medium">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
