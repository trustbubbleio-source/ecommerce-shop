import {
  FREE_SHIPPING_THRESHOLD,
  STORE_PICKUP,
  applyDiscountCode,
  isWelcomeDiscountCode,
  type DeliveryMethod,
} from '@akknerds/shared';
import { cn } from '@akknerds/ui';
import { IncludedVatLine } from '../common/included-vat-line';
import { useFormatMoney } from '../../hooks/use-format-money';
import { useMyOrders } from '../../hooks/use-orders';
import { useAuthStore } from '../../store/auth';
import { type CartItem, cartShipping, cartSubtotal } from '../../store/cart';
import { DeliveryMethodPicker } from './delivery-method-picker';

export function CartSummary({
  items,
  deliveryMethod,
  onDeliveryMethodChange,
  className,
  showDeliveryPicker = true,
}: {
  items: CartItem[];
  deliveryMethod: DeliveryMethod;
  onDeliveryMethodChange?: (method: DeliveryMethod) => void;
  className?: string;
  showDeliveryPicker?: boolean;
}) {
  const formatMoney = useFormatMoney();
  const discountCode = useAuthStore((s) => s.user?.profile.discountCode);
  const token = useAuthStore((s) => s.token);
  const orders = useMyOrders();
  const hasCompletedOrder =
    Boolean(token) &&
    (orders.data?.orders.some((o) => o.status === 'paid' || o.status === 'fulfilled') ?? false);

  const subtotal = cartSubtotal(items);
  const baseShipping = cartShipping(items, deliveryMethod);
  const applied = applyDiscountCode(subtotal, baseShipping, discountCode, { hasCompletedOrder });
  const shipping = applied?.shipping ?? baseShipping;
  const discount = applied?.amount ?? 0;
  const total = Math.max(0, subtotal + shipping - discount);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const isPickup = deliveryMethod === 'pickup';
  const discountLabel = applied
    ? isWelcomeDiscountCode(applied.code)
      ? 'Welcome offer'
      : `Discount (${applied.code})`
    : null;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {showDeliveryPicker && onDeliveryMethodChange ? (
        <DeliveryMethodPicker value={deliveryMethod} onChange={onDeliveryMethodChange} />
      ) : null}

      {isPickup ? (
        <div className="bg-secondary/60 rounded-lg p-3 text-sm">
          <p className="text-foreground font-semibold">Store pickup — free</p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{STORE_PICKUP.line}</p>
        </div>
      ) : (
        subtotal > 0 && (
          <div className="bg-secondary/60 rounded-lg p-3 text-sm">
            {remaining > 0 ? (
              <p className="text-muted-foreground">
                Add{' '}
                <span className="text-foreground font-semibold">{formatMoney(remaining)}</span> for
                free shipping
              </p>
            ) : (
              <p className="text-success font-semibold">You've unlocked free shipping!</p>
            )}
            <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${progress}%` }}
                data-testid="free-shipping-progress"
              />
            </div>
          </div>
        )
      )}

      <div>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="text-foreground font-medium">{formatMoney(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{isPickup ? 'Pickup' : 'Shipping'}</dt>
            <dd className="text-foreground font-medium">
              {shipping === 0 ? 'Free' : formatMoney(shipping)}
            </dd>
          </div>
          {discount > 0 && discountLabel && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{discountLabel}</dt>
              <dd className="text-success font-medium">−{formatMoney(discount)}</dd>
            </div>
          )}
          {discount === 0 && applied?.code === 'FREESHIP' && discountLabel && !isPickup && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{discountLabel}</dt>
              <dd className="text-success font-medium">Free shipping</dd>
            </div>
          )}
          <div className="border-border mt-2 flex justify-between border-t pt-3 text-base">
            <dt className="text-foreground font-bold">Total</dt>
            <dd className="text-foreground font-extrabold">{formatMoney(total)}</dd>
          </div>
        </dl>
        <IncludedVatLine className="mt-1.5" grossCents={total} format={formatMoney} />
      </div>
    </div>
  );
}
