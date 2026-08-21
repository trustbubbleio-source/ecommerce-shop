import { type Product, isCardStyleCategory } from '@akknerds/shared';
import { Card, Rating } from '@akknerds/ui';
import { Link } from 'react-router-dom';
import { AddToCartButton } from './add-to-cart-button';
import { LaunchBadge } from './launch-badge';
import { PriceTag } from './price-tag';
import { ProductArt } from './product-art';
import { ProductPreviewBadge } from './product-preview-badge';

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock <= 0;

  return (
    <Card className="hover:border-foreground/25 hover:shadow-glow group flex flex-col overflow-hidden transition-all hover:-translate-y-1">
      <Link
        to={`/product/${product.slug}`}
        className="bg-muted/20 relative block aspect-[5/7] overflow-hidden"
        aria-label={product.name}
      >
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
        <Rating value={product.rating} reviewCount={product.reviewCount} size={13} />
        <AddToCartButton product={product} block size="sm" compact label="Add to cart" />
      </div>
    </Card>
  );
}
