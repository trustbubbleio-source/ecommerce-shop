import { formatPrice } from '@akknerds/shared';
import { QuantityStepper } from '@akknerds/ui';
import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { type CartItem, useCartStore } from '../../store/cart';
import { ProductArt } from '../product/product-art';

interface CartLineItemProps {
  item: CartItem;
  onNavigate?: () => void;
}

export function CartLineItem({ item, onNavigate }: CartLineItemProps) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const { product, quantity } = item;

  return (
    <div className="flex gap-3 py-4">
      <Link
        to={`/product/${product.slug}`}
        onClick={onNavigate}
        className="border-border size-20 shrink-0 overflow-hidden rounded-lg border"
      >
        <ProductArt product={product} />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/product/${product.slug}`}
            onClick={onNavigate}
            className="text-foreground hover:text-primary line-clamp-2 text-sm font-semibold"
          >
            {product.name}
          </Link>
          <button
            type="button"
            onClick={() => remove(product.id)}
            className="text-muted-foreground hover:text-destructive shrink-0 rounded-md p-1 transition-colors"
            aria-label={`Remove ${product.name}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <QuantityStepper
            value={quantity}
            min={1}
            max={product.stock}
            onChange={(q) => setQuantity(product.id, q)}
          />
          <span className="text-foreground font-semibold">
            {formatPrice(product.price * quantity, product.currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
