import { Star } from 'lucide-react';
import { cn } from '../lib/cn.js';

export interface RatingProps {
  value: number;
  max?: number;
  reviewCount?: number;
  className?: string;
  size?: number;
}

/** Read-only star rating with an accessible label. */
export function Rating({ value, max = 5, reviewCount, className, size = 14 }: RatingProps) {
  const clamped = Math.max(0, Math.min(max, value));
  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      aria-label={`Rated ${clamped} out of ${max}`}
    >
      <span className="flex" aria-hidden="true">
        {Array.from({ length: max }, (_, i) => {
          const fill = Math.max(0, Math.min(1, clamped - i));
          return (
            <span key={i} className="relative" style={{ width: size, height: size }}>
              <Star className="text-muted absolute inset-0" style={{ width: size, height: size }} />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star
                  className="text-primary"
                  fill="currentColor"
                  style={{ width: size, height: size }}
                />
              </span>
            </span>
          );
        })}
      </span>
      {typeof reviewCount === 'number' && (
        <span className="text-muted-foreground text-xs">({reviewCount})</span>
      )}
    </span>
  );
}
