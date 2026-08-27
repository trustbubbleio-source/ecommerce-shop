import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Separator, Skeleton } from '@akknerds/ui';
import { ArrowLeft, MapPin, PackageX } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/empty-state';
import { IncludedVatLine } from '../../components/common/included-vat-line';
import { OrderCarrierDetails } from '../../components/account/order-carrier-details';
import { OrderInvoiceLink } from '../../components/account/order-invoice-link';
import { OrderRouteMap } from '../../components/account/order-route-map';
import { OrderTimeline } from '../../components/account/order-timeline';
import { SITE } from '../../config/site';
import { useFormatMoney } from '../../hooks/use-format-money';
import { useOrder } from '../../hooks/use-orders';
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_VARIANT,
  formatAddress,
  formatOrderDate,
  orderTimeline,
} from '../../lib/order-progress';

export function AccountOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data, isLoading, isError } = useOrder(orderId);
  const formatMoney = useFormatMoney();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={<PackageX />}
        title="Order not found"
        description="This order may have been placed on another account."
        action={
          <Button asChild>
            <Link to="/account/orders">Back to orders</Link>
          </Button>
        }
      />
    );
  }

  const { order } = data;
  const timeline = orderTimeline(order.status, order.fulfillmentStep);
  const cancelled = order.status === 'cancelled';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/account/orders"
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" /> Orders
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Order details</h2>
            <p className="text-muted-foreground mt-1 font-mono text-xs">{order.id}</p>
            <p className="text-muted-foreground text-sm">{formatOrderDate(order.createdAt)}</p>
          </div>
          <Badge variant={ORDER_STATUS_VARIANT[order.status]}>
            {ORDER_STATUS_LABEL[order.status]}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {cancelled ? (
            <p className="text-muted-foreground text-sm">
              This order was cancelled. If you were charged, the refund is processed back to the
              original payment method.
            </p>
          ) : (
            <OrderTimeline state={timeline} cancelled={cancelled} />
          )}
          <Separator />
          <OrderCarrierDetails order={order} />
          <OrderRouteMap destination={order.shippingAddress} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {order.lines.map((line) => (
            <div key={line.productId} className="flex items-start justify-between gap-3 text-sm">
              <div>
                <p className="text-foreground font-medium">{line.name}</p>
                <p className="text-muted-foreground text-xs">Qty {line.quantity}</p>
              </div>
              <span className="font-semibold">{formatMoney(line.unitPrice * line.quantity)}</span>
            </div>
          ))}
          <Separator />
          <div className="text-muted-foreground flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatMoney(order.subtotal)}</span>
          </div>
          <div className="text-muted-foreground flex justify-between text-sm">
            <span>Shipping</span>
            <span>{order.shipping === 0 ? 'Free' : formatMoney(order.shipping)}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatMoney(order.total)}</span>
          </div>
          <IncludedVatLine grossCents={order.total} format={formatMoney} />
          <div className="flex justify-end">
            <OrderInvoiceLink order={order} />
          </div>
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
                <p className="text-foreground font-medium">{order.shippingAddress.fullName}</p>
                <p className="text-muted-foreground leading-relaxed">
                  {formatAddress(order.shippingAddress)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No delivery address was saved on this order.</p>
          )}
          <p className="text-muted-foreground text-xs">
            Confirmation sent to {order.email}. Questions? {SITE.email.orders}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
