import type { Product } from '@akknerds/shared';
import { Button, type ButtonProps, useToast } from '@akknerds/ui';
import { Check, ShoppingCart } from 'lucide-react';
import { toCartProduct, useCartStore } from '../../store/cart';

interface AddToCartButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  product: Product;
  quantity?: number;
  label?: string;
}

export function AddToCartButton({
  product,
  quantity = 1,
  label = 'Add to cart',
  ...buttonProps
}: AddToCartButtonProps) {
  const add = useCartStore((s) => s.add);
  const { toast } = useToast();
  const soldOut = product.stock <= 0;

  return (
    <Button
      disabled={soldOut}
      onClick={() => {
        add(toCartProduct(product), quantity);
        toast({ title: 'Added to cart', description: product.name, variant: 'success' });
      }}
      aria-label={soldOut ? `${product.name} is sold out` : `Add ${product.name} to cart`}
      {...buttonProps}
    >
      {soldOut ? (
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
