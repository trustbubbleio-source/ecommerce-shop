import {
  Button,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@akknerds/ui';
import { ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartCount, useCartStore } from '../../store/cart';
import { CartLineItem } from '../cart/cart-line-item';
import { CartSummary } from '../cart/cart-summary';
import { EmptyState } from '../common/empty-state';

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const items = useCartStore((s) => s.items);
  const count = cartCount(items);
  const navigate = useNavigate();

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}
        >
          <ShoppingBag />
          {count > 0 && (
            <span className="bg-primary text-primary-foreground absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold">
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5" /> Your cart {count > 0 && `(${count})`}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-5">
            <EmptyState
              icon={<ShoppingBag />}
              title="Your cart is empty"
              description="Find your next chase card or sealed box."
              action={<Button onClick={() => go('/shop')}>Browse the shop</Button>}
              className="border-none bg-transparent"
            />
          </div>
        ) : (
          <>
            <div className="divide-border flex-1 divide-y overflow-y-auto px-5">
              {items.map((item) => (
                <CartLineItem key={item.product.id} item={item} onNavigate={() => setOpen(false)} />
              ))}
            </div>
            <SheetFooter className="flex flex-col gap-3">
              <CartSummary items={items} />
              <Button block size="lg" onClick={() => go('/checkout')}>
                Checkout
              </Button>
              <Button variant="outline" block onClick={() => go('/cart')}>
                View full cart
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
