import { ChevronDown } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '../lib/cn.js';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
}

/** Native select (best-in-class on mobile) styled to match the design system. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, ...props }, ref) => (
    <div className="relative inline-flex w-full">
      <select
        ref={ref}
        className={cn(
          'border-input bg-background text-foreground h-11 w-full appearance-none rounded-lg border pl-3.5 pr-10 text-sm font-medium shadow-sm transition-colors',
          'focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:outline-none focus-visible:ring-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-popover text-foreground">
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2" />
    </div>
  ),
);
Select.displayName = 'Select';
