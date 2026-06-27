import { type Product, discountPercent, formatPrice } from '@akknerds/shared';
import { Badge, cn } from '@akknerds/ui';

interface PriceTagProps {
  product: Pick<Product, 'price' | 'compareAtPrice' | 'currency'>;
  className?: string;
  size?: 'sm' | 'lg';
}

export function PriceTag({ product, className, size = 'sm' }: PriceTagProps) {
  const off = discountPercent(product.price, product.compareAtPrice);
  return (
    <div className={cn('flex flex-wrap items-baseline gap-2', className)}>
      <span
        className={cn('text-foreground font-extrabold', size === 'lg' ? 'text-3xl' : 'text-base')}
      >
        {formatPrice(product.price, product.currency)}
      </span>
      {off > 0 && (
        <>
          <span
            className={cn(
              'text-muted-foreground line-through',
              size === 'lg' ? 'text-lg' : 'text-sm',
            )}
          >
            {formatPrice(product.compareAtPrice!, product.currency)}
          </span>
          <Badge variant="success">-{off}%</Badge>
        </>
      )}
    </div>
  );
}
