import {
  type Product,
  categoryLabel,
  languageLabel,
  primaryProductImage,
  resolveAssetUrl,
} from '@akknerds/shared';
import { cn } from '@akknerds/ui';
import { Link } from 'react-router-dom';
import { PriceTag } from '../../components/product/price-tag';
import { LanguageFlag } from '../../components/product/language-flag';
import { KioskLazyImage } from './lazy-image';

export function KioskProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const soldOut = product.stock <= 0;
  const imageUrl = resolveAssetUrl(
    primaryProductImage(product),
    import.meta.env.VITE_ASSET_CDN_URL,
  );

  return (
    <Link
      to={`/kiosk/product/${product.slug}`}
      state={{ product }}
      className={cn(
        'bg-card/80 border-border/60 tap-highlight-none flex h-full flex-col overflow-hidden rounded-2xl border',
        'content-visibility-auto contain-intrinsic-kiosk-card',
      )}
      aria-label={`${product.name}, ${languageLabel(product.language)}, ${soldOut ? 'sold out' : 'in stock'}`}
    >
      <div className="bg-muted/20 relative aspect-[5/7] shrink-0 overflow-hidden">
        <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
          <LanguageFlag language={product.language} />
          <span className="rounded-full bg-black/40 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white/90 backdrop-blur-sm">
            {categoryLabel(product.category)}
          </span>
        </div>
        {imageUrl ? (
          <KioskLazyImage
            src={imageUrl}
            alt={product.name}
            priority={priority}
            placeholderColor={product.accent}
          />
        ) : (
          <div
            className="size-full"
            style={{ background: `linear-gradient(150deg, ${product.accent} -10%, #0b0712 78%)` }}
            role="img"
            aria-label={product.name}
          />
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-destructive px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-white">
              Sold out
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
          {product.set}
        </p>
        <h2 className="text-foreground line-clamp-2 text-xl font-semibold leading-snug">
          {product.name}
        </h2>
        <div className="mt-auto pt-1">
          <PriceTag product={product} className="[&_span]:text-2xl" />
        </div>
      </div>
    </Link>
  );
}
