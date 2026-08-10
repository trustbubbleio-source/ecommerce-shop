import { describe, expect, it } from 'vitest';
import { isSetInSeries, setsForSeries } from './series-sets.js';

describe('series-sets', () => {
  it('returns sets only for the selected series', () => {
    expect(setsForSeries('Scarlet & Violet')).toContain('Obsidian Flames');
    expect(setsForSeries('Scarlet & Violet')).toContain('151');
    expect(setsForSeries('Sword & Shield')).toContain('Lost Origin');
    expect(setsForSeries('')).toEqual([]);
  });

  it('rejects sets from another series', () => {
    expect(isSetInSeries('Lost Origin', 'Sword & Shield')).toBe(true);
    expect(isSetInSeries('Lost Origin', 'Scarlet & Violet')).toBe(false);
    expect(isSetInSeries('Obsidian Flames', 'Scarlet & Violet')).toBe(true);
  });

  it('includes shop-specific taxonomy', () => {
    expect(setsForSeries('One More Rip Exclusive')).toEqual(['Mixed']);
    expect(setsForSeries('Illustration Collection')).toEqual([
      'First Partner s2',
      'First Partner s1',
    ]);
    expect(setsForSeries('Protection')).toEqual(['Accessories']);
  });
});
