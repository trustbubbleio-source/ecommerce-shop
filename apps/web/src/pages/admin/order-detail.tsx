import {
  FULFILLMENT_STEPS,
  FULFILLMENT_STEP_LABELS,
  defaultFulfillmentStep,
  formatPrice,
  hasCarrierTracking,
  type FulfillmentStep,
} from '@akknerds/shared';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Skeleton,
  useToast,
} from '@akknerds/ui';
import { ArrowLeft, MapPin, PackageX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { OrderInvoiceLink } from '../../components/account/order-invoice-link';
import { OrderTimeline } from '../../components/account/order-timeline';
import { EmptyState } from '../../components/common/empty-state';
import { IncludedVatLine } from '../../components/common/included-vat-line';
import { useAdminOrder, useAdminUpdateOrder } from '../../hooks/use-orders';
import { ApiError } from '@akknerds/api-client';
import {
  formatAddress,
  formatOrderDate,
  orderTimeline,
} from '../../lib/order-progress';

export function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data, isLoading, isError } = useAdminOrder(orderId);
  const update = useAdminUpdateOrder();
  const { toast } = useToast();
  const [carrierName, setCarrierName] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');

  const order = data?.order;
  useEffect(() => {
    setCarrierName(order?.carrierName ?? '');
    setTrackingUrl(order?.trackingUrl ?? '');
  }, [order?.id, order?.carrierName, order?.trackingUrl]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <EmptyState
        icon={<PackageX />}
        title="Order not found"
        action={
          <Button asChild>
            <Link to="/admin/orders">Back to orders</Link>
          </Button>
        }
      />
    );
  }

  const paid = order.status === 'paid' || order.status === 'fulfilled';
  const currentStep = order.fulfillmentStep ?? defaultFulfillmentStep(order.status);
  const tracked = hasCarrierTracking(order.subtotal, order.currency);
  const timeline = orderTimeline(order.status, order.fulfillmentStep);

  const save = (fulfillmentStep: FulfillmentStep) => {
    update.mutate(
      {
        id: order.id,
        input: { fulfillmentStep, carrierName, trackingUrl },
      },
      {
        onSuccess: () => toast({ title: 'Order updated', variant: 'success' }),
        onError: (error) => {
          toast({
            title: 'Update failed',
            description: error instanceof ApiError ? error.message : 'Please try again.',
            variant: 'error',
          });
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/admin/orders"
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" /> Orders
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">Fulfill order</h1>
        <p className="text-muted-foreground mt-1 font-mono text-xs">{order.id}</p>
        <p className="text-muted-foreground text-sm">
          {formatOrderDate(order.createdAt)} · {order.email}
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {order.status === 'cancelled' ? (
              <p className="text-muted-foreground text-sm">This order was cancelled.</p>
            ) : (
              <OrderTimeline state={timeline} cancelled={false} />
            )}
            {paid ? (
              <div className="flex flex-col gap-2">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Set current step
                </p>
                <div className="flex flex-wrap gap-2">
                  {FULFILLMENT_STEPS.map((step) => (
                    <Button
                      key={step}
                      type="button"
                      size="sm"
                      variant={currentStep === step ? 'primary' : 'outline'}
                      disabled={update.isPending}
                      onClick={() => save(step)}
                    >
                      {FULFILLMENT_STEP_LABELS[step]}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Timeline unlocks after Stripe confirms payment.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Carrier</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {tracked ? (
                <p className="text-muted-foreground text-xs">
                  This order includes carrier tracking. Add the name and URL when the parcel is
                  collected — they show on the customer order page.
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Below the tracking threshold — website timeline only. Carrier URL is optional.
                </p>
              )}
              <Field label="Carrier name">
                {(props) => (
                  <Input
                    {...props}
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    placeholder="PostNord"
                  />
                )}
              </Field>
              <Field label="Tracking URL">
                {(props) => (
                  <Input
                    {...props}
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    placeholder="https://"
                  />
                )}
              </Field>
              {paid && currentStep ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={update.isPending}
                  onClick={() => save(currentStep)}
                >
                  Save carrier details
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              {order.shippingAddress ? (
                <div className="flex gap-3">
                  <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="font-medium">{order.shippingAddress.fullName}</p>
                    <p className="text-muted-foreground leading-relaxed">
                      {formatAddress(order.shippingAddress)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No delivery address saved.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {order.lines.map((line) => (
            <div key={line.productId} className="flex justify-between gap-3 text-sm">
              <div>
                <p className="font-medium">{line.name}</p>
                <p className="text-muted-foreground text-xs">Qty {line.quantity}</p>
              </div>
              <span className="font-semibold">
                {formatPrice(line.unitPrice * line.quantity, order.currency)}
              </span>
            </div>
          ))}
          <div className="border-border flex justify-between border-t pt-3 text-base font-bold">
            <span>Total</span>
            <span>{formatPrice(order.total, order.currency)}</span>
          </div>
          <IncludedVatLine
            grossCents={order.total}
            format={(cents) => formatPrice(cents, order.currency)}
          />
          <div className="flex justify-end">
            <OrderInvoiceLink order={order} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
