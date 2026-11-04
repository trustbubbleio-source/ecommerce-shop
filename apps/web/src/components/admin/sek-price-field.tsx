import { formatMoney, parseSekMajorToOre } from '@akknerds/shared';
import { Input, type InputProps } from '@akknerds/ui';
import type { ReactNode } from 'react';

interface SekPriceFieldProps {
  inputProps: InputProps;
  price: string;
  onPriceChange: (price: string) => void;
  /** Optional trailing control (e.g. Cardmarket wand). */
  trailing?: ReactNode;
}

/**
 * Admin price input in kronor (kr). Stores/edits major units; parent converts to öre on save.
 */
export function SekPriceField({ inputProps, price, onPriceChange, trailing }: SekPriceFieldProps) {
  const ore = parseSekMajorToOre(price);
  const preview = Number.isFinite(ore) && ore > 0 ? formatMoney(ore) : null;

  const field = (
    <Input
      {...inputProps}
      className={trailing ? 'min-w-0 flex-1' : inputProps.className}
      inputMode="decimal"
      autoComplete="off"
      placeholder="399.00"
      value={price}
      onChange={(event) => onPriceChange(event.target.value)}
    />
  );

  return (
    <div className="flex flex-col gap-1.5">
      {trailing ? <div className="flex gap-2">{field}{trailing}</div> : field}
      <p className="text-muted-foreground text-xs">
        {preview ? (
          <>
            Customers see <span className="text-foreground font-medium">{preview}</span>
          </>
        ) : (
          <>Enter kronor, e.g. <span className="text-foreground font-medium">399</span> or{' '}
            <span className="text-foreground font-medium">399.00</span> — not öre.</>
        )}
      </p>
    </div>
  );
}
