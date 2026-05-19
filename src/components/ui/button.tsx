'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const variantClasses = {
  default:
    'bg-gradient-to-b from-primary to-primary-dark text-white shadow-sm hover:shadow-md hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0',
  secondary:
    'bg-surface-tertiary text-slate-800 shadow-sm hover:bg-slate-200 dark:bg-dark-surface-tertiary dark:text-slate-100 dark:hover:bg-slate-700/80 hover:-translate-y-0.5 active:translate-y-0',
  outline:
    'border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-dark-surface-tertiary/80 hover:-translate-y-0.5 active:translate-y-0',
  ghost:
    'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-dark-surface-tertiary/80',
  danger: 'bg-gradient-to-b from-danger to-rose-700 text-white shadow-sm hover:shadow-md hover:shadow-danger/20 hover:-translate-y-0.5 active:translate-y-0',
  link: 'text-primary underline-offset-4 hover:underline',
} as const;

const sizeClasses = {
  sm: 'h-8 px-3.5 text-xs gap-1.5',
  default: 'h-10 px-5 text-sm gap-2',
  lg: 'h-11 px-6 text-sm gap-2',
  xl: 'h-12 px-7 text-base gap-2.5',
  icon: 'h-9 w-9',
} as const;

type Variant = keyof typeof variantClasses;
type Size = keyof typeof sizeClasses;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[--radius-button] text-sm font-medium',
          'transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button };
