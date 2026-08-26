import { type OrderStatus, formatPrice } from '@akknerds/shared';
import { Badge, type BadgeProps, Button, Card, CardContent, Skeleton } from '@akknerds/ui';
import { Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/common/empty-state';
import { useMyOrders } from '../../hooks/use-orders';

const STATUS_VARIANT: Record<OrderStatus, BadgeProps['variant']> = {
  pending: 'muted',
  paid: 'success',
  fulfilled: 'default',
  cancelled: 'destructive',
};

export function AccountOrdersPage() {
  const orders = useMyOrders();

  if (orders.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (orders.data && orders.data.orders.length > 0) {
    return (
      <ul className="flex flex-col gap-3">
        {orders.data.orders.map((order) => (
          <li key={order.id}>
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div>
                  <p className="text-foreground font-mono text-sm">{order.id}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(order.createdAt).toLocaleDateString()} ·{' '}
                    {order.lines.reduce((n, l) => n + l.quantity, 0)} items
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={STATUS_VARIANT[order.status]}>{order.status}</Badge>
                  <span className="font-bold">{formatPrice(order.total, order.currency)}</span>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
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
