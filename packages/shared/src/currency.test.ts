import { describe, expect, it } from 'vitest';
import {
  BASE_CURRENCY,
  DEFAULT_DISPLAY_CURRENCY,
  EUR_TO_SEK,
  convertFromEur,
  formatMoney,
  normalizeCurrency,
} from './currency.js';

describe('currency', () => {
  it('keeps EUR as catalog base and SEK as shopper default', () => {
    expect(BASE_CURRENCY).toBe('eur');
    expect(DEFAULT_DISPLAY_CURRENCY).toBe('sek');
  });

  it('defaults unknown values to the catalog base (EUR)', () => {
    expect(normalizeCurrency(undefined)).toBe(BASE_CURRENCY);
    expect(normalizeCurrency('usd')).toBe(BASE_CURRENCY);
    expect(normalizeCurrency('SEK')).toBe('sek');
  });

  it('converts EUR cents to SEK öre with the fixed rate', () => {
    expect(convertFromEur(100, 'eur')).toBe(100);
    expect(convertFromEur(100, 'sek')).toBe(Math.round(100 * EUR_TO_SEK));
    expect(convertFromEur(7500, 'sek')).toBe(Math.round(7500 * EUR_TO_SEK));
  });

  it('formats money from the EUR base and defaults display to SEK', () => {
    expect(formatMoney(1299, 'eur')).toMatch(/12[,.]99/);
    expect(formatMoney(100, 'sek')).toMatch(/11[,.]30|11\.30/);
    expect(formatMoney(100)).toMatch(/11[,.]30|11\.30/);
  });
});
