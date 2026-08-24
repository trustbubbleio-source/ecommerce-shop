import { type Product, discountPercent } from '@akknerds/shared';
import { Badge, cn } from '@akknerds/ui';
import { useFormatMoney } from '../../hooks/use-format-money';

interface PriceTagProps {
  product: Pick<Product, 'price' | 'compareAtPrice' | 'currency'>;
  className?: string;
  size?: 'sm' | 'lg';
}

export function PriceTag({ product, className, size = 'sm' }: PriceTagProps) {
  const formatMoney = useFormatMoney();
  const off = discountPercent(product.price, product.compareAtPrice);
  return (
    <div className={cn('flex flex-wrap items-baseline gap-2', className)}>
      <span
        className={cn('text-foreground font-extrabold', size === 'lg' ? 'text-3xl' : 'text-base')}
      >
        {formatMoney(product.price)}
      </span>
      {off > 0 && (
        <>
          <span
            className={cn(
              'text-muted-foreground line-through',
              size === 'lg' ? 'text-lg' : 'text-sm',
            )}
          >
            {formatMoney(product.compareAtPrice!)}
          </span>
          <Badge variant="success">-{off}%</Badge>
        </>
      )}
    </div>
  );
}
