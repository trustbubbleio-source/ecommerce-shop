import { formatPrice } from '@akknerds/shared';
import { api } from '@akknerds/api-client';
import { Button, Card, CardContent, Separator, Spinner } from '@akknerds/ui';
import { CheckCircle2, PackageX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/common/empty-state';
import { IncludedVatLine } from '../components/common/included-vat-line';
import { useOrder } from '../hooks/use-orders';
import { useCartStore } from '../store/cart';

export function CheckoutSuccessPage() {
  const [params] = useSearchParams();
  const orderId = params.get('order_id') ?? undefined;
  const paypalToken = params.get('token') ?? undefined;
  const isMock = params.get('mock') === '1';
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(Boolean(paypalToken) && !isMock);
  const captureStarted = useRef(false);

  const { data, isLoading, isError, refetch } = useOrder(orderId);
  const clear = useCartStore((s) => s.clear);
  const cleared = useRef(false);

  useEffect(() => {
    if (!orderId || isMock || captureStarted.current) return;
    // Already settled (card capture finished before navigation) — skip.
    if (data?.order?.status === 'paid' || data?.order?.status === 'fulfilled') return;
    if (!paypalToken && data?.order?.status !== 'pending') return;

    captureStarted.current = true;
    setCapturing(true);
    void api
      .capturePayPalOrder({
        orderId,
        paypalOrderId: paypalToken,
        token: paypalToken,
      })
      .then(() => refetch())
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Payment capture failed';
        setCaptureError(message);
      })
      .finally(() => setCapturing(false));
  }, [orderId, paypalToken, isMock, data?.order?.status, refetch]);

  useEffect(() => {
    const status = data?.order?.status;
    if ((status === 'paid' || status === 'fulfilled') && !cleared.current) {
      clear();
      cleared.current = true;
    }
  }, [data, clear]);

  if (isLoading || capturing) {
    return (
      <div className="container flex justify-center py-24">
        <Spinner className="size-8" label={capturing ? 'Confirming PayPal payment' : 'Loading your order'} />
      </div>
    );
  }

  if (!orderId || isError || !data) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={<PackageX />}
          title="We couldn't find that order"
          description={
            captureError ??
            "If you just paid, your confirmation email will have the details."
          }
          action={
            <Button asChild>
              <Link to="/shop">Continue buying</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const { order } = data;
  const pending = order.status === 'pending';

  return (
    <div className="container max-w-2xl py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="bg-success/15 text-success grid size-16 place-items-center rounded-full">
          <CheckCircle2 className="size-9" />
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {pending ? 'Finishing your payment…' : 'Thank you for your order!'}
        </h1>
        <p className="text-muted-foreground">
          A confirmation has been sent to{' '}
          <span className="text-foreground font-medium">{order.email}</span>.
        </p>
        {captureError ? (
          <p className="text-destructive max-w-md text-sm">{captureError}</p>
        ) : paypalToken || isMock ? (
          <p className="text-muted-foreground max-w-md text-sm">
            You will receive an order confirmation from One More Rip. PayPal may also send its own
            payment receipt — both are normal.
          </p>
        ) : (
          <p className="text-muted-foreground max-w-md text-sm">
            You will receive an order confirmation from One More Rip shortly.
          </p>
        )}
        <p className="text-muted-foreground text-sm">
          Order <span className="text-foreground font-mono">{order.id}</span>
        </p>
      </div>

      <Card className="mt-8">
        <CardContent className="flex flex-col gap-3 pt-6">
          {order.lines.map((line) => (
            <div key={line.productId} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-foreground">
                {line.name} <span className="text-muted-foreground">× {line.quantity}</span>
              </span>
              <span className="font-medium">
                {formatPrice(line.unitPrice * line.quantity, order.currency)}
              </span>
            </div>
          ))}
          <Separator />
          <div className="text-muted-foreground flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal, order.currency)}</span>
          </div>
          <div className="text-muted-foreground flex justify-between text-sm">
            <span>{order.deliveryMethod === 'pickup' ? 'Pickup' : 'Shipping'}</span>
            <span>
              {order.shipping === 0 ? 'Free' : formatPrice(order.shipping, order.currency)}
            </span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatPrice(order.total, order.currency)}</span>
          </div>
          <IncludedVatLine
            grossCents={order.total}
            format={(cents) => formatPrice(cents, order.currency)}
          />
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link to="/shop">Continue buying</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={`/account/orders/${order.id}`}>View this order</Link>
        </Button>
      </div>
    </div>
  );
}
