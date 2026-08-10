import { Button, Card, CardContent, CardHeader, CardTitle } from '@akknerds/ui';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CartLineItem } from '../components/cart/cart-line-item';
import { CartSummary } from '../components/cart/cart-summary';
import { EmptyState } from '../components/common/empty-state';
import { PageHeader } from '../components/common/page-header';
import { PRELAUNCH, isPrelaunchActive } from '../config/launch';
import { useCartStore } from '../store/cart';

export function CartPage() {
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const prelaunch = isPrelaunchActive();

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={<ShoppingBag />}
          title="Your cart is empty"
          description="Once you add products they'll show up here."
          action={
            <Button asChild>
              <Link to="/shop">Browse the shop</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <PageHeader title="Your cart" />
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-4">
          <div className="divide-border border-border divide-y rounded-xl border px-5">
            {items.map((item) => (
              <CartLineItem key={item.product.id} item={item} />
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            className="text-muted-foreground self-start"
          >
            <Trash2 /> Clear cart
          </Button>
        </div>

        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <CartSummary items={items} />
            {prelaunch ? (
              <Button block size="lg" disabled>
                {PRELAUNCH.buttonLabel}
              </Button>
            ) : (
              <Button asChild block size="lg">
                <Link to="/checkout">Proceed to checkout</Link>
              </Button>
            )}
            <Button asChild variant="outline" block>
              <Link to="/shop">Continue shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
