import { Loader2 } from 'lucide-react';
import { cn } from '../lib/cn.js';

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  label?: string;
}

export function Spinner({ className, label = 'Loading', ...props }: SpinnerProps) {
  return (
    <Loader2
      role="status"
      aria-label={label}
      className={cn('text-primary size-5 animate-spin', className)}
      {...props}
    />
  );
}
