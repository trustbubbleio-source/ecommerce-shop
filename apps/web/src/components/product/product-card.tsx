import { type Product, categoryLabel, isCardStyleCategory, languageLabel } from '@akknerds/shared';
import { Card, Rating } from '@akknerds/ui';
import { Link } from 'react-router-dom';
import { AddToCartButton } from './add-to-cart-button';
import { FavoriteButton } from './favorite-button';
import { LanguageFlag } from './language-flag';
import { LaunchBadge } from './launch-badge';
import { PriceTag } from './price-tag';
import { ProductArt } from './product-art';
import { ProductPreviewBadge } from './product-preview-badge';

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock <= 0;
  const showCategoryChip = !isCardStyleCategory(product.category);

  return (
    <Card className="hover:border-foreground/25 hover:shadow-glow group relative flex flex-col overflow-hidden transition-all hover:-translate-y-1">
      <FavoriteButton
        productId={product.id}
        productName={product.name}
        className="absolute right-2 top-2 z-20"
      />
      <Link
        to={`/product/${product.slug}`}
        className="bg-muted/20 relative block aspect-[5/7] overflow-hidden"
        aria-label={`${product.name}, ${languageLabel(product.language)} print`}
      >
        <div className="absolute left-2 top-2 z-20 flex h-11 items-center gap-1.5">
          <LanguageFlag language={product.language} />
          {showCategoryChip && (
            <span className="rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/90 backdrop-blur-sm">
              {categoryLabel(product.category)}
            </span>
          )}
        </div>
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.02]">
          <ProductArt product={product} variant="card" />
        </div>
        <LaunchBadge />
        {isCardStyleCategory(product.category) && <ProductPreviewBadge product={product} />}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
            <span className="rounded-full bg-destructive px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Sold out
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-col gap-2 p-3">
        <PriceTag product={product} />
        {!isCardStyleCategory(product.category) && (
          <Rating value={product.rating} reviewCount={product.reviewCount} size={13} />
        )}
        <AddToCartButton product={product} block size="sm" compact label="Add to cart" />
      </div>
    </Card>
  );
}
