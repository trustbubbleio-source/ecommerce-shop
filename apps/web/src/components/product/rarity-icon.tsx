import { cn } from '@akknerds/ui';
import oneStar from '../../assets/rarity/1.png';
import twoStar from '../../assets/rarity/2.png';
import threeStar from '../../assets/rarity/3.png';
import { getRarityVisual } from '../../lib/rarity-visual';

const STAR_ASSETS = {
  1: oneStar,
  2: twoStar,
  3: threeStar,
} as const;

interface RarityIconProps {
  rarity: string | null | undefined;
  className?: string;
}

/** Pokémon TCG rarity marker — circle, diamond, or bundled star PNG. */
export function RarityIcon({ rarity, className }: RarityIconProps) {
  const visual = getRarityVisual(rarity);
  if (!visual) return null;

  if (visual.kind === 'common') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={cn('size-3 shrink-0', className)}
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
      </svg>
    );
  }

  if (visual.kind === 'uncommon') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={cn('size-3 shrink-0', className)}
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2L22 12L12 22L2 12L12 2Z" />
      </svg>
    );
  }

  return (
    <img
      src={STAR_ASSETS[visual.tier]}
      alt=""
      width={18}
      height={18}
      className={cn('size-[1.125rem] shrink-0 object-contain', className)}
      loading="lazy"
      decoding="async"
    />
  );
}
