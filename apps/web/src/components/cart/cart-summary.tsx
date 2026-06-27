import { FREE_SHIPPING_THRESHOLD, formatPrice } from '@akknerds/shared';
import { cn } from '@akknerds/ui';
import { type CartItem, cartShipping, cartSubtotal, cartTotal } from '../../store/cart';

export function CartSummary({ items, className }: { items: CartItem[]; className?: string }) {
  const currency = items[0]?.product.currency ?? 'usd';
  const subtotal = cartSubtotal(items);
  const shipping = cartShipping(items);
  const total = cartTotal(items);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {subtotal > 0 && (
        <div className="bg-secondary/60 rounded-lg p-3 text-sm">
          {remaining > 0 ? (
            <p className="text-muted-foreground">
              Add{' '}
              <span className="text-foreground font-semibold">
                {formatPrice(remaining, currency)}
              </span>{' '}
              for free shipping
            </p>
          ) : (
            <p className="text-success font-semibold">You've unlocked free shipping! 🎉</p>
          )}
          <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${progress}%` }}
              data-testid="free-shipping-progress"
            />
          </div>
        </div>
      )}

      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="text-foreground font-medium">{formatPrice(subtotal, currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className="text-foreground font-medium">
            {shipping === 0 ? 'Free' : formatPrice(shipping, currency)}
          </dd>
        </div>
        <div className="border-border mt-2 flex justify-between border-t pt-3 text-base">
          <dt className="text-foreground font-bold">Total</dt>
          <dd className="text-foreground font-extrabold">{formatPrice(total, currency)}</dd>
        </div>
      </dl>
    </div>
  );
}
