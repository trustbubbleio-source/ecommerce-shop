import { CURRENCY_LABELS, SUPPORTED_CURRENCIES, type SupportedCurrency } from '@akknerds/shared';
import { cn } from '@akknerds/ui';
import { useCurrencyStore } from '../../store/currency';

export function CurrencySwitcher({ className }: { className?: string }) {
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);

  return (
    <div
      role="group"
      aria-label="Currency"
      className={cn(
        'border-border bg-secondary/60 inline-flex items-center rounded-lg border p-0.5',
        className,
      )}
    >
      {SUPPORTED_CURRENCIES.map((code) => {
        const active = currency === code;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => setCurrency(code as SupportedCurrency)}
            className={cn(
              'rounded-md px-2 py-1 text-[11px] font-semibold tracking-wide transition-colors',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {CURRENCY_LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
