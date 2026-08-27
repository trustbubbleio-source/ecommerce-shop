import { Badge, Button, Card, CardContent, Skeleton } from '@akknerds/ui';
import { ChevronRight, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OrderInvoiceLink } from '../../components/account/order-invoice-link';
import { EmptyState } from '../../components/common/empty-state';
import { useFormatMoney } from '../../hooks/use-format-money';
import { useMyOrders } from '../../hooks/use-orders';
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_VARIANT,
  formatOrderDate,
  orderHeadline,
  orderItemCount,
} from '../../lib/order-progress';

export function AccountOrdersPage() {
  const orders = useMyOrders();
  const formatMoney = useFormatMoney();

  if (orders.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (orders.data && orders.data.orders.length > 0) {
    return (
      <ul className="flex flex-col gap-3">
        {orders.data.orders.map((order) => {
          const items = orderItemCount(order);
          const city = order.shippingAddress?.city;
          return (
            <li key={order.id}>
              <Card className="relative transition-colors hover:border-foreground/25">
                <Link
                  to={`/account/orders/${order.id}`}
                  className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`${orderHeadline(order)}, ${ORDER_STATUS_LABEL[order.status]}, ${formatMoney(order.total)}`}
                />
                <CardContent className="pointer-events-none relative z-10 flex items-center gap-3 pt-6">
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate font-semibold">{orderHeadline(order)}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {formatOrderDate(order.createdAt)} · {items} {items === 1 ? 'item' : 'items'}
                      {city ? ` · ${city}` : ''}
                    </p>
                    <p className="text-muted-foreground mt-1 font-mono text-[11px]">{order.id}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge variant={ORDER_STATUS_VARIANT[order.status]}>
                      {ORDER_STATUS_LABEL[order.status]}
                    </Badge>
                    <span className="font-bold">{formatMoney(order.total)}</span>
                    <OrderInvoiceLink order={order} className="pointer-events-auto relative z-20" />
                  </div>
                  <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <EmptyState
      icon={<Package />}
      title="No orders yet"
      description="When you place an order it will appear here."
      action={
        <Button asChild>
          <Link to="/shop">Start buying</Link>
        </Button>
      }
    />
  );
}
