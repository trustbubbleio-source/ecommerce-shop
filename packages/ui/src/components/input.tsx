import { forwardRef } from 'react';
import { cn } from '../lib/cn.js';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        // text-base on mobile avoids iOS auto-zoom on focus; desktop keeps text-sm.
        'border-input bg-background text-foreground flex h-11 w-full rounded-lg border px-3.5 text-base shadow-sm transition-colors md:text-sm',
        'placeholder:text-muted-foreground',
        'focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:outline-none focus-visible:ring-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/40',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
