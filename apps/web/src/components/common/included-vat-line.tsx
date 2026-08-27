import { VAT_PERCENT, vatIncludedIn } from '@akknerds/shared';
import { cn } from '@akknerds/ui';

interface IncludedVatLineProps {
  grossCents: number;
  format: (cents: number) => string;
  className?: string;
}

/** Breakdown of VAT already included in a gross total — not an extra charge. */
export function IncludedVatLine({ grossCents, format, className }: IncludedVatLineProps) {
  const vat = vatIncludedIn(grossCents);
  if (vat <= 0) return null;

  return (
    <div className={cn('text-muted-foreground flex justify-between text-xs', className)}>
      <span>of which VAT ({VAT_PERCENT}%)</span>
      <span>{format(vat)}</span>
    </div>
  );
}
