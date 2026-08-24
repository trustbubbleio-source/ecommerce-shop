import { describe, expect, it } from 'vitest';
import {
  BASE_CURRENCY,
  EUR_TO_SEK,
  convertFromEur,
  formatMoney,
  normalizeCurrency,
} from './currency.js';

describe('currency', () => {
  it('defaults unknown values to EUR', () => {
    expect(normalizeCurrency(undefined)).toBe(BASE_CURRENCY);
    expect(normalizeCurrency('usd')).toBe(BASE_CURRENCY);
    expect(normalizeCurrency('SEK')).toBe('sek');
  });

  it('converts EUR cents to SEK öre with the fixed rate', () => {
    expect(convertFromEur(100, 'eur')).toBe(100);
    expect(convertFromEur(100, 'sek')).toBe(Math.round(100 * EUR_TO_SEK));
    expect(convertFromEur(7500, 'sek')).toBe(Math.round(7500 * EUR_TO_SEK));
  });

  it('formats money from the EUR base', () => {
    expect(formatMoney(1299, 'eur')).toMatch(/12[,.]99/);
    expect(formatMoney(100, 'sek')).toMatch(/11[,.]30|11\.30/);
  });
});
