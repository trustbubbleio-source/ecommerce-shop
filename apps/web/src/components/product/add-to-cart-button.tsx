import type { Product } from '@akknerds/shared';
import { Button, type ButtonProps, useToast } from '@akknerds/ui';
import { Check, Clock, ShoppingCart } from 'lucide-react';
import { PRELAUNCH, usePurchaseLocked } from '../../config/launch';
import { toCartProduct, useCartStore } from '../../store/cart';

interface AddToCartButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  product: Product;
  quantity?: number;
  label?: string;
  /** Use compact prelaunch copy (e.g. product cards). */
  compact?: boolean;
}

export function AddToCartButton({
  product,
  quantity = 1,
  label = 'Add to cart',
  compact = false,
  ...buttonProps
}: AddToCartButtonProps) {
  const add = useCartStore((s) => s.add);
  const { toast } = useToast();
  const soldOut = product.stock <= 0;
  const prelaunch = usePurchaseLocked();
  const disabled = soldOut || prelaunch;
  const prelaunchLabel = compact ? PRELAUNCH.buttonLabelShort : PRELAUNCH.buttonLabel;

  return (
    <Button
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        add(toCartProduct(product), quantity);
        toast({ title: 'Added to cart', description: product.name, variant: 'success' });
      }}
      aria-label={
        prelaunch
          ? `${product.name} — ${PRELAUNCH.description}`
          : soldOut
            ? `${product.name} is sold out`
            : `Add ${product.name} to cart`
      }
      {...buttonProps}
    >
      {prelaunch ? (
        <>
          <Clock className="size-4 shrink-0" />
          {prelaunchLabel}
        </>
      ) : soldOut ? (
        <>
          <Check /> Sold out
        </>
      ) : (
        <>
          <ShoppingCart /> {label}
        </>
      )}
    </Button>
  );
}
