import {
  MERCHANT,
  VAT_PERCENT,
  vatIncludedIn,
  type Order,
} from '@akknerds/shared';
import { Button, Skeleton } from '@akknerds/ui';
import { ArrowLeft, PackageX, Printer } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/empty-state';
import { useFormatMoney } from '../../hooks/use-format-money';
import { useOrder } from '../../hooks/use-orders';
import { formatAddress, formatOrderDate } from '../../lib/order-progress';

export function AccountOrderReceiptPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data, isLoading, isError } = useOrder(orderId);
  const formatMoney = useFormatMoney();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={<PackageX />}
        title="Receipt not found"
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
  const paid = order.status === 'paid' || order.status === 'fulfilled';

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/account/orders/${encodeURIComponent(order.id)}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" /> Order details
        </Link>
        {paid ? (
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print / Save PDF
          </Button>
        ) : null}
      </div>

      {!paid ? (
        <p className="text-muted-foreground text-sm">
          A receipt is available once this order is paid.
        </p>
      ) : (
        <ReceiptDocument order={order} formatMoney={formatMoney} />
      )}
    </div>
  );
}

function ReceiptDocument({
  order,
  formatMoney,
}: {
  order: Order;
  formatMoney: (cents: number) => string;
}) {
  const isPickup = order.deliveryMethod === 'pickup';
  const vat = vatIncludedIn(order.total);

  return (
    <article className="receipt-paper border-border bg-white text-neutral-900 shadow-card rounded-xl border p-6 sm:p-8 print:rounded-none print:border-0 print:shadow-none">
      <header className="border-neutral-200 flex flex-col gap-1 border-b pb-5">
        <h1 className="text-xl font-extrabold tracking-tight">{MERCHANT.legalName}</h1>
        <p className="text-neutral-600 text-sm">{MERCHANT.store.line}</p>
        <p className="text-neutral-600 text-xs">
          Org.nr {MERCHANT.organisationNumber} · VAT {MERCHANT.vatNumber}
        </p>
        <p className="text-neutral-600 text-xs">{MERCHANT.email}</p>
      </header>

      <div className="mt-5 flex flex-col gap-1">
        <h2 className="text-lg font-bold tracking-tight">Receipt</h2>
        <p className="font-mono text-xs text-neutral-600">{order.id}</p>
        <p className="text-sm text-neutral-600">{formatOrderDate(order.createdAt)}</p>
      </div>

      <section className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="font-semibold text-neutral-800">Customer</p>
          <p className="text-neutral-600">{order.email}</p>
          {order.shippingAddress ? (
            <div className="mt-2 text-neutral-600">
              <p className="font-medium text-neutral-800">{order.shippingAddress.fullName}</p>
              <p className="leading-relaxed">{formatAddress(order.shippingAddress)}</p>
            </div>
          ) : null}
        </div>
        <div>
          <p className="font-semibold text-neutral-800">Payment</p>
          <p className="text-neutral-600">Paid online (PayPal Checkout)</p>
          <p className="mt-2 font-semibold text-neutral-800">Delivery</p>
          <p className="text-neutral-600">{isPickup ? 'Store pickup — Båstad' : 'Shipping'}</p>
        </div>
      </section>

      <section className="mt-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-neutral-200 border-b text-left text-neutral-500">
              <th className="pb-2 font-medium">Item</th>
              <th className="pb-2 text-right font-medium">Qty</th>
              <th className="pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => (
              <tr key={line.productId} className="border-neutral-100 border-b">
                <td className="py-2.5 pr-3 font-medium text-neutral-900">{line.name}</td>
                <td className="py-2.5 text-right text-neutral-600">{line.quantity}</td>
                <td className="py-2.5 text-right font-semibold">
                  {formatMoney(line.unitPrice * line.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-4 flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between text-neutral-600">
          <span>Subtotal</span>
          <span>{formatMoney(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>{isPickup ? 'Pickup' : 'Shipping'}</span>
          <span>{order.shipping === 0 ? 'Free' : formatMoney(order.shipping)}</span>
        </div>
        <div className="border-neutral-200 mt-2 flex justify-between border-t pt-3 text-base font-bold text-neutral-900">
          <span>Total</span>
          <span>{formatMoney(order.total)}</span>
        </div>
        {vat > 0 ? (
          <div className="flex justify-between text-xs text-neutral-500">
            <span>of which VAT ({VAT_PERCENT}%)</span>
            <span>{formatMoney(vat)}</span>
          </div>
        ) : null}
      </section>

      <footer className="border-neutral-200 mt-8 border-t pt-4 text-xs text-neutral-500">
        <p>Prices include VAT. Thank you for shopping at {MERCHANT.legalName}.</p>
      </footer>
    </article>
  );
}
