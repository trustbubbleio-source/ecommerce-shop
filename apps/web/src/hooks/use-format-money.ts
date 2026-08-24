import { formatMoney } from '@akknerds/shared';
import { useCurrencyStore } from '../store/currency';

/** Format EUR-base catalog cents in the shopper’s selected currency. */
export function useFormatMoney() {
  const currency = useCurrencyStore((s) => s.currency);
  return (centsEur: number) => formatMoney(centsEur, currency);
}
