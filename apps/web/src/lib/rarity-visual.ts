import type { CardRarity } from '@akknerds/shared';

export type RarityVisual =
  | { kind: 'common' }
  | { kind: 'uncommon' }
  | { kind: 'stars'; tier: 1 | 2 | 3 };

const RARITY_VISUAL: Record<CardRarity, RarityVisual> = {
  common: { kind: 'common' },
  uncommon: { kind: 'uncommon' },
  rare: { kind: 'stars', tier: 1 },
  'holo-rare': { kind: 'stars', tier: 1 },
  'illustration-rare': { kind: 'stars', tier: 1 },
  'ultra-rare': { kind: 'stars', tier: 2 },
  'secret-rare': { kind: 'stars', tier: 3 },
};

/** Maps a product rarity slug (or label) to the icon we render in the UI. */
export function getRarityVisual(rarity: string | null | undefined): RarityVisual | null {
  if (!rarity) return null;

  const slug = rarity.toLowerCase().trim().replace(/\s+/g, '-') as CardRarity;
  if (slug in RARITY_VISUAL) return RARITY_VISUAL[slug];

  const label = rarity.toLowerCase();

  if (label.includes('common')) return { kind: 'common' };
  if (label.includes('uncommon')) return { kind: 'uncommon' };
  if (label.includes('hyper') || label.includes('secret')) return { kind: 'stars', tier: 3 };
  if (label.includes('ultra') || label.includes('special illustration')) {
    return { kind: 'stars', tier: 2 };
  }
  if (label.includes('rare') || label.includes('holo') || label.includes('illustration')) {
    return { kind: 'stars', tier: 1 };
  }

  return { kind: 'stars', tier: 1 };
}
