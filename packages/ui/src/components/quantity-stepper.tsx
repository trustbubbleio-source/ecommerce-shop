import { Minus, Plus } from 'lucide-react';
import { cn } from '../lib/cn.js';

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
  label?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  className,
  label = 'Quantity',
}: QuantityStepperProps) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const set = (n: number) => onChange(clamp(n));

  return (
    <div
      className={cn(
        'border-border bg-background inline-flex items-center rounded-lg border',
        className,
      )}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className="text-foreground hover:bg-secondary flex size-10 items-center justify-center rounded-l-lg transition-colors disabled:opacity-40"
        onClick={() => set(value - 1)}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="size-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        className="border-border h-10 w-12 border-x bg-transparent text-center text-sm font-semibold [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        value={value}
        min={min}
        max={max}
        aria-label={label}
        onChange={(e) => {
          const next = Number.parseInt(e.target.value, 10);
          set(Number.isNaN(next) ? min : next);
        }}
      />
      <button
        type="button"
        className="text-foreground hover:bg-secondary flex size-10 items-center justify-center rounded-r-lg transition-colors disabled:opacity-40"
        onClick={() => set(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
