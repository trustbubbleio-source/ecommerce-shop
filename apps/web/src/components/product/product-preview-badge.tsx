import { type Product, isCardStyleCategory, productPreviewBadge } from '@akknerds/shared';
import { RarityIcon } from './rarity-icon';

export function ProductPreviewBadge({ product }: { product: Product }) {
  if (!isCardStyleCategory(product.category)) return null;

  const label = productPreviewBadge(product);
  const showIcon = Boolean(product.rarity);

  if (!label && !showIcon) return null;

  return (
    <span className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/80 px-2 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur-sm">
      {label && <span>{label}</span>}
      {showIcon && <RarityIcon rarity={product.rarity} />}
    </span>
  );
}
