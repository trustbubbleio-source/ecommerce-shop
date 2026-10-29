import {
  DEFAULT_DISPLAY_CURRENCY,
  normalizeCurrency,
  type SupportedCurrency,
} from '@akknerds/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CurrencyState {
  currency: SupportedCurrency;
  setCurrency: (currency: SupportedCurrency) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: DEFAULT_DISPLAY_CURRENCY,
      setCurrency: (currency) => set({ currency: normalizeCurrency(currency) }),
    }),
    // v2: SEK default — new key so existing EUR localStorage does not stick.
    { name: 'onemorerip-currency-v2' },
  ),
);
