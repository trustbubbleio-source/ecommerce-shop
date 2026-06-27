import type { Product } from '@akknerds/shared';
import { Badge, Card, Rating } from '@akknerds/ui';
import { Link } from 'react-router-dom';
import { AddToCartButton } from './add-to-cart-button';
import { PriceTag } from './price-tag';
import { ProductArt } from './product-art';

export function ProductCard({ product }: { product: Product }) {
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <Card className="hover:border-primary/50 hover:shadow-glow group flex flex-col overflow-hidden transition-all hover:-translate-y-1">
      <Link
        to={`/product/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden"
        aria-label={product.name}
      >
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
          <ProductArt product={product} />
        </div>
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
          {product.isNew && <Badge>New</Badge>}
          {product.stock <= 0 && <Badge variant="destructive">Sold out</Badge>}
          {lowStock && <Badge variant="secondary">Only {product.stock} left</Badge>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <Link
            to={`/product/${product.slug}`}
            className="text-foreground hover:text-primary line-clamp-2 font-semibold leading-snug transition-colors"
          >
            {product.name}
          </Link>
          <Rating value={product.rating} reviewCount={product.reviewCount} />
        </div>
        <div className="mt-auto flex flex-col gap-3">
          <PriceTag product={product} />
          <AddToCartButton product={product} block size="sm" label="Add" />
        </div>
      </div>
    </Card>
  );
}
