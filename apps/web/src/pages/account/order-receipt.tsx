import {
  MERCHANT,
  VAT_PERCENT,
  vatIncludedIn,
  type Order,
} from '@akknerds/shared';
import { Button, Skeleton } from '@akknerds/ui';
import { ArrowLeft, PackageX, Printer } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/empty-state';
import { SITE } from '../../config/site';
import { useFormatMoney } from '../../hooks/use-format-money';
import { useOrder } from '../../hooks/use-orders';

export function AccountOrderReceiptPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const { data, isLoading, isError } = useOrder(orderId);
  const formatMoney = useFormatMoney();
  const printedRef = useRef(false);
  const autoPrint = searchParams.get('print') === '1';

  const order = data?.order;
  const paid = order?.status === 'paid' || order?.status === 'fulfilled';

  useEffect(() => {
    if (!autoPrint || !paid || !order || printedRef.current) return;
    printedRef.current = true;
    const timer = window.setTimeout(() => window.print(), 200);
    return () => window.clearTimeout(timer);
  }, [autoPrint, paid, order]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !order) {
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

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 print:max-w-none">
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

function formatReceiptDateTime(iso: string): string {
  return new Date(iso).toLocaleString('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Plain amount like Zettle's "25,00" (no currency suffix). */
function formatPlainAmount(ore: number): string {
  return new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(ore / 100);
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
  const siteHost = SITE.url.replace(/^https?:\/\//, '');

  return (
    <div className="receipt-stage -mx-4 bg-[#ececec] px-4 py-6 sm:mx-0 sm:rounded-2xl print:mx-0 print:bg-white print:p-0 print:rounded-none">
      <article className="receipt-paper mx-auto max-w-[22rem] bg-white text-[15px] leading-snug text-[#222] shadow-sm print:max-w-none print:shadow-none">
        <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4 text-[12px] text-[#8a8a8a]">
          <span>Kvitto</span>
          <span className="text-right">{formatReceiptDateTime(order.createdAt)}</span>
        </div>

        <header className="px-4 pb-4 text-center">
          <h1 className="text-[20px] font-bold tracking-tight text-[#111]">{MERCHANT.legalName}</h1>
          <p className="mt-1 text-[13px] text-[#666]">
            {MERCHANT.store.street} {MERCHANT.store.city}, {MERCHANT.store.postalCode}
          </p>
          <a
            href={SITE.url}
            className="mt-1 inline-block text-[13px] text-[#2f6fed] underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {siteHost}
          </a>
          <p className="mt-2 font-mono text-[11px] text-[#999]">{order.id}</p>
        </header>

        <div className="mx-4 border-t border-[#ddd]" />

        <section className="px-4 py-3">
          <ul className="space-y-3">
            {order.lines.map((line) => (
              <li key={line.productId}>
                <div className="flex items-start justify-between gap-3">
                  <span className="font-medium text-[#222]">{line.name}</span>
                  <span className="shrink-0 tabular-nums text-[#222]">
                    {formatMoney(line.unitPrice * line.quantity)}
                  </span>
                </div>
                <p className="mt-0.5 text-[13px] text-[#888]">
                  {line.quantity} x {formatPlainAmount(line.unitPrice)}
                </p>
              </li>
            ))}
            {order.shipping > 0 ? (
              <li>
                <div className="flex items-start justify-between gap-3">
                  <span className="font-medium text-[#222]">Frakt</span>
                  <span className="shrink-0 tabular-nums text-[#222]">
                    {formatMoney(order.shipping)}
                  </span>
                </div>
                <p className="mt-0.5 text-[13px] text-[#888]">1 x {formatPlainAmount(order.shipping)}</p>
              </li>
            ) : isPickup ? (
              <li>
                <div className="flex items-start justify-between gap-3">
                  <span className="font-medium text-[#222]">Butikshämtning</span>
                  <span className="shrink-0 tabular-nums text-[#222]">0,00&nbsp;kr</span>
                </div>
              </li>
            ) : null}
          </ul>
        </section>

        <div className="mx-4 border-t border-[#ddd]" />

        <section className="space-y-1 px-4 py-4 text-right">
          <p className="text-[17px] font-bold text-[#111]">Totalt: {formatMoney(order.total)}</p>
          {vat > 0 ? (
            <>
              <p className="font-bold text-[#222]">Total moms: {formatMoney(vat)}</p>
              <p className="text-[13px] text-[#777]">
                Moms ({VAT_PERCENT}%): {formatMoney(vat)}
              </p>
            </>
          ) : null}
        </section>

        <section className="mx-4 mb-4 rounded-md border border-[#ddd] px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#888]">Köp</p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-[#222]">Onlinebetalning</p>
              <p className="mt-0.5 text-[13px] text-[#777]">PayPal Checkout</p>
              {order.email ? <p className="mt-1 text-[12px] text-[#999]">{order.email}</p> : null}
            </div>
            <p className="shrink-0 font-bold tabular-nums text-[#222]">{formatMoney(order.total)}</p>
          </div>
        </section>

        <footer className="px-4 pb-6 pt-1 text-center">
          <p className="text-[15px] font-bold text-[#222]">
            Tack för ditt köp hos {MERCHANT.legalName}!
          </p>
          <p className="mt-3 text-[11px] leading-relaxed text-[#999]">
            Org.nr {MERCHANT.organisationNumber} · VAT {MERCHANT.vatNumber}
          </p>
        </footer>
      </article>
    </div>
  );
}
