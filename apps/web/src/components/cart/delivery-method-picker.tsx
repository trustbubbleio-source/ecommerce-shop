import { STORE_PICKUP, type DeliveryMethod } from '@akknerds/shared';
import { cn } from '@akknerds/ui';
import { MapPin, Truck } from 'lucide-react';

const OPTIONS: Array<{
  id: DeliveryMethod;
  label: string;
  hint: string;
  icon: typeof Truck;
}> = [
  {
    id: 'shipping',
    label: 'Ship',
    hint: 'Tracked PostNord',
    icon: Truck,
  },
  {
    id: 'pickup',
    label: 'Pickup',
    hint: `Free · ${STORE_PICKUP.city}`,
    icon: MapPin,
  },
];

export function DeliveryMethodPicker({
  value,
  onChange,
  className,
}: {
  value: DeliveryMethod;
  onChange: (method: DeliveryMethod) => void;
  className?: string;
}) {
  return (
    <div
      className={cn('grid grid-cols-2 gap-2', className)}
      role="radiogroup"
      aria-label="Delivery method"
    >
      {OPTIONS.map(({ id, label, hint, icon: Icon }) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(id)}
            className={cn(
              'border-border flex flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left transition-colors',
              'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              selected
                ? 'border-primary bg-primary/10 ring-primary/30 ring-1'
                : 'hover:bg-muted/50 bg-background',
            )}
          >
            <span className="text-foreground flex items-center gap-2 text-sm font-semibold">
              <Icon className={cn('size-4', selected ? 'text-primary' : 'text-muted-foreground')} />
              {label}
            </span>
            <span className="text-muted-foreground text-xs leading-snug">{hint}</span>
          </button>
        );
      })}
    </div>
  );
}
