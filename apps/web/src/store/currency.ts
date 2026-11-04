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
    // v3: SEK only — drop any stored EUR selection from older builds.
    { name: 'onemorerip-currency-v3' },
  ),
);
