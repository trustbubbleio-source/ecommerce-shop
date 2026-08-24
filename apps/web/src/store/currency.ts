import { BASE_CURRENCY, normalizeCurrency, type SupportedCurrency } from '@akknerds/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CurrencyState {
  currency: SupportedCurrency;
  setCurrency: (currency: SupportedCurrency) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: BASE_CURRENCY,
      setCurrency: (currency) => set({ currency: normalizeCurrency(currency) }),
    }),
    { name: 'onemorerip-currency' },
  ),
);
