import { type OrderStatus, formatPrice } from '@akknerds/shared';
import { Badge, type BadgeProps, Button, Card, CardContent, Skeleton } from '@akknerds/ui';
import { LogOut, Package } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/common/empty-state';
import { PageHeader } from '../components/common/page-header';
import { useMyOrders } from '../hooks/use-orders';
import { useAuthStore } from '../store/auth';

const STATUS_VARIANT: Record<OrderStatus, BadgeProps['variant']> = {
  pending: 'muted',
  paid: 'success',
  fulfilled: 'default',
  cancelled: 'destructive',
};

export function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const orders = useMyOrders();

  if (!user) {
    return <Navigate to="/login" state={{ from: '/account' }} replace />;
  }

  return (
    <div className="container max-w-3xl py-8">
      <PageHeader title={`Hi, ${user.name.split(' ')[0]}`} description={user.email}>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 self-start"
          onClick={() => {
            logout();
            navigate('/');
          }}
        >
          <LogOut /> Sign out
        </Button>
      </PageHeader>

      <h2 className="mb-4 text-lg font-bold">Order history</h2>

      {orders.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : orders.data && orders.data.orders.length > 0 ? (
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
      ) : (
        <EmptyState
          icon={<Package />}
          title="No orders yet"
          description="When you place an order it will appear here."
          action={
            <Button asChild>
              <Link to="/shop">Start shopping</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
