import {
  FULFILLMENT_STEP_LABELS,
  defaultFulfillmentStep,
  formatPrice,
  type FulfillmentStep,
} from '@akknerds/shared';
import { Badge, Card, CardContent, Skeleton, cn } from '@akknerds/ui';
import { ChevronRight, Package, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/common/empty-state';
import { useAdminOrders } from '../../hooks/use-orders';
import {
  ADMIN_ORDER_TABS,
  ORDER_STATUS_VARIANT,
  adminOrderTabOf,
  formatOrderDate,
  orderHeadline,
  orderItemCount,
  orderMatchesAdminTab,
  orderOpsLabel,
  type AdminOrderTab,
} from '../../lib/order-progress';

function stepOf(order: { status: string; fulfillmentStep?: FulfillmentStep }) {
  return order.fulfillmentStep ?? defaultFulfillmentStep(order.status);
}

const EMPTY_COPY: Record<AdminOrderTab, { title: string; description: string }> = {
  all: {
    title: 'No orders yet',
    description: 'When a customer pays, the order appears here for packing.',
  },
  pack: {
    title: 'Nothing to pack',
    description: 'Paid orders waiting to be packed show up here.',
  },
  deliver: {
    title: 'Nothing heading out',
    description: 'Packed orders waiting for pickup or in transit show up here.',
  },
  finished: {
    title: 'No finished orders',
    description: 'Delivered orders land here when you mark them done.',
  },
  unpaid: {
    title: 'No awaiting payment',
    description: 'Checkout sessions that have not been paid yet show up here.',
  },
  inactive: {
    title: 'No inactive orders',
    description: 'Cancelled orders show up here.',
  },
};

export function AdminOrdersPage() {
  const list = useAdminOrders();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<AdminOrderTab>('all');
  const orders = list.data?.orders ?? [];

  const counts = useMemo(() => {
    const next: Record<AdminOrderTab, number> = {
      all: orders.length,
      pack: 0,
      deliver: 0,
      finished: 0,
      unpaid: 0,
      inactive: 0,
    };
    for (const order of orders) {
      next[adminOrderTabOf(order)] += 1;
    }
    return next;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (!orderMatchesAdminTab(order, tab)) return false;
      if (!q) return true;
      return (
        order.id.toLowerCase().includes(q) ||
        order.email.toLowerCase().includes(q) ||
        orderHeadline(order).toLowerCase().includes(q) ||
        (order.shippingAddress?.city ?? '').toLowerCase().includes(q)
      );
    });
  }, [orders, query, tab]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Orders</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Paid orders land here to pack. Stripe handles payment, invoices and receipts — update
          the fulfillment timeline as you go.
        </p>
      </div>

      <div className="relative min-w-0">
        <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search email, order id, product…"
          aria-label="Search orders"
          className="border-input bg-background h-11 w-full rounded-lg border pl-10 pr-3 text-sm"
        />
      </div>

      <div
        role="tablist"
        aria-label="Order queues"
        className="border-border -mx-1 flex gap-1 overflow-x-auto border-b px-1 pb-px"
      >
        {ADMIN_ORDER_TABS.map((item) => {
          const selected = tab === item.id;
          const count = counts[item.id];
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(item.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors',
                selected
                  ? 'border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground border-transparent',
              )}
            >
              {item.label}
              <span
                className={cn(
                  'min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold tabular-nums leading-none',
                  selected
                    ? 'bg-primary/15 text-primary'
                    : count > 0
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {list.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : list.isError ? (
        <EmptyState
          icon={<Package />}
          title="Couldn't load orders"
          description="Sign in again if this keeps happening."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title={query.trim() ? 'No matching orders' : EMPTY_COPY[tab].title}
          description={
            query.trim() ? 'Try another search or a different tab.' : EMPTY_COPY[tab].description
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((order) => {
            const items = orderItemCount(order);
            const city = order.shippingAddress?.city;
            const step = stepOf(order);
            return (
              <li key={order.id}>
                <Link
                  to={`/admin/orders/${order.id}`}
                  aria-label={`Open ${orderHeadline(order)}`}
                  className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="transition-colors hover:border-foreground/25">
                    <CardContent className="flex items-center gap-3 pt-6">
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground truncate font-semibold">{orderHeadline(order)}</p>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {formatOrderDate(order.createdAt)} · {order.email}
                          {city ? ` · ${city}` : ''} · {items} {items === 1 ? 'item' : 'items'}
                        </p>
                        <p className="text-muted-foreground mt-1 font-mono text-[11px]">{order.id}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <Badge variant={ORDER_STATUS_VARIANT[order.status]}>
                          {step ? FULFILLMENT_STEP_LABELS[step] : orderOpsLabel(order)}
                        </Badge>
                        <span className="font-bold">{formatPrice(order.total, order.currency)}</span>
                      </div>
                      <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
