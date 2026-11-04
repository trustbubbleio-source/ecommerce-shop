import { describe, expect, it } from 'vitest';
import {
  BASE_CURRENCY,
  DEFAULT_DISPLAY_CURRENCY,
  LEGACY_EUR_TO_SEK,
  convertFromEur,
  formatMoney,
  normalizeCurrency,
  toSekOre,
} from './currency.js';

describe('currency', () => {
  it('uses SEK as the only shop currency', () => {
    expect(BASE_CURRENCY).toBe('sek');
    expect(DEFAULT_DISPLAY_CURRENCY).toBe('sek');
    expect(normalizeCurrency('eur')).toBe('sek');
    expect(normalizeCurrency(undefined)).toBe('sek');
    expect(normalizeCurrency('SEK')).toBe('sek');
  });

  it('converts legacy EUR cents to SEK öre', () => {
    expect(convertFromEur(100)).toBe(Math.round(100 * LEGACY_EUR_TO_SEK));
    expect(toSekOre(100, 'eur')).toBe(Math.round(100 * LEGACY_EUR_TO_SEK));
    expect(toSekOre(100, 'sek')).toBe(100);
  });

  it('formats SEK öre', () => {
    expect(formatMoney(1130)).toMatch(/11[,.]30/);
    expect(formatMoney(100, 'eur')).toMatch(/11[,.]30|11\.30/);
  });
});
