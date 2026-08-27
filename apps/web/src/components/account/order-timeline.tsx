import { cn } from '@akknerds/ui';
import { Check } from 'lucide-react';
import { ORDER_STEPS, type OrderTimelineState } from '../../lib/order-progress';

interface OrderTimelineProps {
  state: OrderTimelineState;
  cancelled?: boolean;
}

export function OrderTimeline({ state, cancelled = false }: OrderTimelineProps) {
  return (
    <ol className="flex flex-col">
      {ORDER_STEPS.map((step, index) => {
        const done = index < state.completedCount;
        const current = !cancelled && !done && index === state.currentIndex;
        const upcoming = !done && !current;

        return (
          <li key={step.id} className="flex gap-3">
            <div className="flex w-6 flex-col items-center">
              <span
                className={cn(
                  'grid size-6 place-items-center rounded-full border text-[11px] font-bold',
                  done && 'border-primary bg-primary text-primary-foreground',
                  current && 'border-primary text-primary bg-primary/15',
                  upcoming && 'border-border text-muted-foreground',
                  cancelled && 'border-border text-muted-foreground opacity-50',
                )}
                aria-hidden
              >
                {done ? <Check className="size-3.5" /> : index + 1}
              </span>
              {index < ORDER_STEPS.length - 1 && (
                <span
                  className={cn(
                    'my-1 w-px flex-1 min-h-6',
                    done ? 'bg-primary/70' : 'bg-border',
                  )}
                  aria-hidden
                />
              )}
            </div>
            <div className={cn('pb-4', index === ORDER_STEPS.length - 1 && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-semibold leading-6',
                  upcoming || cancelled ? 'text-muted-foreground' : 'text-foreground',
                )}
              >
                {step.label}
                {current && (
                  <span className="text-primary ml-2 text-[11px] font-semibold uppercase tracking-wide">
                    In progress
                  </span>
                )}
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">{step.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
