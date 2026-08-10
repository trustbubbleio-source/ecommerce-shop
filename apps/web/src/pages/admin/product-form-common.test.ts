import { describe, expect, it } from 'vitest';
import { buildSingleCardDescription } from './product-form-common';

describe('buildSingleCardDescription', () => {
  it('builds the standard single-card listing copy', () => {
    const text = buildSingleCardDescription({
      name: 'Charizard ex',
      rarity: 'ultra-rare',
      condition: 'near-mint',
    });
    expect(text.startsWith('Charizard ex (Ultra Rare) Near Mint')).toBe(true);
    expect(text).toContain('Pack fresh and carefully handled');
    expect(text).toContain('Please refer to the photos');
  });
});
