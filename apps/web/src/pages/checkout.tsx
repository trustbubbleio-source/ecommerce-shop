import { Card, CardContent, CardHeader, CardTitle } from '@akknerds/ui';
import { Navigate } from 'react-router-dom';
import { CartSummary } from '../components/cart/cart-summary';
import { CheckoutForm } from '../components/checkout/checkout-form';
import { PageHeader } from '../components/common/page-header';
import { ProductArt } from '../components/product/product-art';
import { usePurchaseLocked } from '../config/launch';
import { useFormatMoney } from '../hooks/use-format-money';
import { useCartStore } from '../store/cart';

export function CheckoutPage() {
  const formatMoney = useFormatMoney();
  const items = useCartStore((s) => s.items);

  const purchaseLocked = usePurchaseLocked();

  if (purchaseLocked || items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <div className="container py-8">
      <PageHeader title="Checkout" />
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Shipping & contact</CardTitle>
          </CardHeader>
          <CardContent>
            <CheckoutForm />
          </CardContent>
        </Card>

        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li key={item.product.id} className="flex items-center gap-3">
                  <div className="border-border relative size-14 shrink-0 overflow-hidden rounded-lg border">
                    <ProductArt product={item.product} />
                    <span className="bg-primary text-primary-foreground absolute -right-1 -top-1 grid size-5 place-items-center rounded-full text-[11px] font-bold">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.product.name}</p>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatMoney(item.product.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <CartSummary items={items} className="border-border border-t pt-4" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
