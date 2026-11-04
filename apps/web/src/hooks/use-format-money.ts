import { formatMoney } from '@akknerds/shared';

/** Format catalogue / cart amounts (SEK öre) for display. */
export function useFormatMoney() {
  return (ore: number) => formatMoney(ore);
}
