import { type Product, categoryLabel, isCardStyleCategory, primaryProductImage, resolveAssetUrl } from '@akknerds/shared';
import { cn } from '@akknerds/ui';
import { Pokeball } from '../common/pokeball';

type ArtProduct = Pick<Product, 'accent' | 'set' | 'series' | 'category' | 'name'> &
  Partial<Pick<Product, 'images' | 'image'>>;

export type ProductArtVariant = 'detail' | 'card';

function ProductArtOverlay({
  product,
  show,
}: {
  product: ArtProduct;
  show: boolean;
}) {
  if (!show) return null;

  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
      <span className="absolute left-3 top-3 rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/90 backdrop-blur-sm">
        {categoryLabel(product.category)}
      </span>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
          {product.series}
        </p>
        <p className="text-xl font-extrabold leading-tight text-white drop-shadow">{product.set}</p>
      </div>
    </>
  );
}

/**
 * Branded product artwork.
 * - Shop cards (single): clean image + card number/rarity badge (handled in ProductCard).
 * - Shop cards (sealed etc.): series/set overlay on the image like the original design.
 * - Detail page: full branded overlay on the fallback artwork.
 */
export function ProductArt({
  product,
  className,
  variant = 'detail',
}: {
  product: ArtProduct;
  className?: string;
  variant?: ProductArtVariant;
}) {
  const isCardStyle = isCardStyleCategory(product.category);
  const isShopCard = variant === 'card';
  const showOverlay = !isCardStyle && (variant === 'detail' || isShopCard);

  const imageUrl = resolveAssetUrl(
    primaryProductImage(product),
    import.meta.env.VITE_ASSET_CDN_URL,
  );

  const imageFitClass =
    isCardStyle || isShopCard ? 'object-contain p-1' : 'object-cover';

  if (imageUrl) {
    return (
      <div
        className={cn('relative h-full w-full overflow-hidden', className)}
        role="img"
        aria-label={product.name}
      >
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className={cn('h-full w-full', imageFitClass)}
        />
        <ProductArtOverlay product={product} show={showOverlay} />
      </div>
    );
  }

  return (
    <div
      className={cn('relative h-full w-full overflow-hidden', className)}
      style={{ background: `linear-gradient(150deg, ${product.accent} -10%, #0b0712 78%)` }}
      role="img"
      aria-label={product.name}
    >
      <Pokeball className="absolute -right-8 -top-8 size-44 text-white/10" />
      <Pokeball className="absolute -bottom-12 -left-10 size-40 text-black/20" />
      <ProductArtOverlay product={product} show={showOverlay} />
    </div>
  );
}
