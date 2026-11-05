import {
  FULFILLMENT_STEPS,
  FULFILLMENT_STEP_LABELS,
  cancelOrderInputSchema,
  defaultFulfillmentStep,
  formatPrice,
  type FulfillmentStep,
} from '@akknerds/shared';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Skeleton,
  Textarea,
  useToast,
} from '@akknerds/ui';
import { ArrowLeft, ExternalLink, MapPin, PackageX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { OrderInvoiceLink } from '../../components/account/order-invoice-link';
import { OrderTimeline } from '../../components/account/order-timeline';
import { OrderPackingLine } from '../../components/admin/order-packing-line';
import { EmptyState } from '../../components/common/empty-state';
import { IncludedVatLine } from '../../components/common/included-vat-line';
import { useAdminCancelOrder, useAdminOrder, useAdminUpdateOrder } from '../../hooks/use-orders';
import { ApiError } from '@akknerds/api-client';
import {
  formatAddress,
  formatOrderDate,
  orderTimeline,
} from '../../lib/order-progress';
import { stripeCheckoutSessionUrl } from '../../lib/stripe-dashboard';

export function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data, isLoading, isError } = useAdminOrder(orderId);
  const update = useAdminUpdateOrder();
  const cancelOrder = useAdminCancelOrder();
  const { toast } = useToast();
  const [carrierName, setCarrierName] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string>();

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
  const delivered = order.status === 'fulfilled' || order.fulfillmentStep === 'delivered';
  const canCancel = !delivered && order.status !== 'cancelled';
  const busy = update.isPending || cancelOrder.isPending;
  const currentStep = order.fulfillmentStep ?? defaultFulfillmentStep(order.status);
  const timeline = orderTimeline(order.status, order.fulfillmentStep);
  const stripeUrl = order.stripeSessionId
    ? stripeCheckoutSessionUrl(order.stripeSessionId)
    : null;

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
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight">Fulfill order</h1>
          {order.status === 'cancelled' ? (
            <Badge variant="destructive">Cancelled</Badge>
          ) : order.status === 'pending' ? (
            <Badge variant="muted">Pending</Badge>
          ) : paid && stripeUrl ? (
            <a
              href={stripeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
              aria-label="Open payment in Stripe Dashboard"
            >
              <Badge variant="success" className="hover:bg-success/25 gap-1">
                Paid
                <ExternalLink className="size-3" aria-hidden />
              </Badge>
            </a>
          ) : paid ? (
            <Badge variant="success">Paid</Badge>
          ) : null}
        </div>
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
              <div className="flex flex-col gap-2 text-sm">
                <p className="text-muted-foreground">This order was cancelled.</p>
                {order.cancelReason ? <p>{order.cancelReason}</p> : null}
              </div>
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
        disabled={busy}
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
              <p className="text-muted-foreground text-xs">
                Every online order ships tracked. Add the carrier name and tracking URL when the
                parcel is collected — they show on the customer order page.
              </p>
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
                  disabled={busy}
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

      {canCancel ? (
        <Card>
          <CardHeader>
            <CardTitle>Cancel order</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                const parsed = cancelOrderInputSchema.safeParse({ reason: cancelReason });
                if (!parsed.success) {
                  setCancelError(parsed.error.issues[0]?.message ?? 'Add a short reason');
                  return;
                }
                setCancelError(undefined);
                cancelOrder.mutate(
                  { id: order.id, input: parsed.data },
                  {
                    onSuccess: (result) => {
                      setCancelReason('');
                      toast({
                        title: 'Order cancelled',
                        description: result.emailed
                          ? 'The customer has been emailed.'
                          : 'Saved, but the email could not be sent.',
                        variant: result.emailed ? 'success' : 'error',
                      });
                    },
                    onError: (error) => {
                      toast({
                        title: 'Could not cancel',
                        description: error instanceof ApiError ? error.message : 'Please try again.',
                        variant: 'error',
                      });
                    },
                  },
                );
              }}
            >
              <p className="text-muted-foreground text-sm">
                {order.status === 'paid'
                  ? 'The customer is refunded in full and emailed this reason.'
                  : 'The customer is emailed this reason. Nothing has been charged.'}
              </p>
              <Field label="Reason">
                {(props) => (
                  <Textarea
                    {...props}
                    value={cancelReason}
                    onChange={(event) => {
                      setCancelReason(event.target.value);
                      if (cancelError) setCancelError(undefined);
                    }}
                    placeholder="This card is no longer in stock."
                    rows={3}
                    aria-invalid={Boolean(cancelError)}
                    aria-describedby={cancelError ? 'cancel-reason-error' : undefined}
                  />
                )}
              </Field>
              {cancelError ? (
                <p id="cancel-reason-error" className="text-destructive text-xs" role="alert">
                  {cancelError}
                </p>
              ) : null}
              <Button type="submit" variant="destructive" disabled={busy} className="self-start">
                {cancelOrder.isPending ? 'Cancelling…' : 'Cancel order'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Items to pack</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col">
            {order.lines.map((line) => (
              <OrderPackingLine key={line.productId} line={line} currency={order.currency} />
            ))}
          </div>
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
