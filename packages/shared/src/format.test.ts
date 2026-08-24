import { describe, expect, it } from 'vitest';
import { categoryLabel, discountPercent, formatPrice, productPreviewBadge, slugify, titleCase } from './format.js';

describe('formatPrice', () => {
  it('formats cents into EUR by default', () => {
    expect(formatPrice(1299)).toMatch(/12[,.]99/);
    expect(formatPrice(0)).toMatch(/0[,.]00/);
  });

  it('respects a different currency', () => {
    expect(formatPrice(1000, 'EUR', 'de-DE')).toContain('10,00');
    expect(formatPrice(1130, 'SEK', 'sv-SE')).toMatch(/11[,.]30/);
  });
});

describe('slugify', () => {
  it('produces url-safe slugs', () => {
    expect(slugify('Pokémon 151 Booster Box!')).toBe('pok-mon-151-booster-box');
    expect(slugify('  Trim  Me  ')).toBe('trim-me');
    expect(slugify('already-slug')).toBe('already-slug');
  });
});

describe('categoryLabel', () => {
  it('maps known categories to labels', () => {
    expect(categoryLabel('booster-box')).toBe('Booster Box');
    expect(categoryLabel('elite-trainer-box')).toBe('Elite Trainer Box');
    expect(categoryLabel('single-card')).toBe('Single Card');
    expect(categoryLabel('graded-slab')).toBe('Graded Slabs');
  });

  it('falls back to title-cased label for unknown categories', () => {
    expect(categoryLabel('mystery-thing')).toBe('Mystery Thing');
  });
});

describe('titleCase', () => {
  it('capitalizes each word and ignores extra spaces', () => {
    expect(titleCase('hello world')).toBe('Hello World');
    expect(titleCase('  spaced   out ')).toBe('Spaced Out');
    expect(titleCase('')).toBe('');
  });
});

describe('productPreviewBadge', () => {
  it('returns card number without a rarity suffix', () => {
    expect(
      productPreviewBadge({
        category: 'single-card',
        cardNumber: '178/165',
        rarity: 'secret-rare',
      }),
    ).toBe('178/165');
  });

  it('falls back to category for sealed products', () => {
    expect(productPreviewBadge({ category: 'booster-pack' })).toBe('Booster Pack');
  });
});

describe('discountPercent', () => {
  it('returns 0 without a compare-at price', () => {
    expect(discountPercent(1000)).toBe(0);
  });

  it('returns 0 when compare-at is not higher', () => {
    expect(discountPercent(1000, 1000)).toBe(0);
    expect(discountPercent(1000, 800)).toBe(0);
  });

  it('computes the rounded percentage saved', () => {
    expect(discountPercent(8999, 10999)).toBe(18);
    expect(discountPercent(7500, 10000)).toBe(25);
  });
});
