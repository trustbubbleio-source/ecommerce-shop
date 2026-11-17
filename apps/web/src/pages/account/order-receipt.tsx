import {
  MERCHANT,
  VAT_PERCENT,
  orderPaymentReceiptLabel,
  vatIncludedIn,
  type Order,
} from '@akknerds/shared';
import { Button, Skeleton } from '@akknerds/ui';
import { PackageX } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import logoMark from '../../assets/rarity/onemorerip-logo-transparent-bg-white.png';
import { DocumentMeta } from '../../components/common/document-meta';
import { EmptyState } from '../../components/common/empty-state';
import { SITE } from '../../config/site';
import { useFormatMoney } from '../../hooks/use-format-money';
import { useOrder } from '../../hooks/use-orders';
import { formatAddress } from '../../lib/order-progress';

export function AccountOrderReceiptPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useOrder(orderId);
  const formatMoney = useFormatMoney();
  const printedRef = useRef(false);

  const order = data?.order;
  const paid = order?.status === 'paid' || order?.status === 'fulfilled';

  useEffect(() => {
    if (!paid || !order || printedRef.current) return;
    printedRef.current = true;
    let left = false;

    const leave = () => {
      if (left) return;
      left = true;
      if (window.opener) {
        window.close();
        return;
      }
      navigate(`/account/orders/${encodeURIComponent(order.id)}`, { replace: true });
    };

    const onAfterPrint = () => leave();
    window.addEventListener('afterprint', onAfterPrint);

    const timer = window.setTimeout(() => {
      const previousTitle = document.title;
      document.title = ' ';
      window.print();
      document.title = previousTitle;
      // Chrome usually fires afterprint; if not, leave once print() returns.
      leave();
    }, 150);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, [paid, order, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <DocumentMeta title="Kvitto" robots="noindex,nofollow" />
        <Skeleton className="mx-auto h-96 w-full max-w-md" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <>
        <DocumentMeta title="Kvitto" robots="noindex,nofollow" />
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
      </>
    );
  }

  if (!paid) {
    return (
      <>
        <DocumentMeta title="Kvitto" robots="noindex,nofollow" />
        <p className="text-muted-foreground text-sm">
          A receipt is available once this order is paid.
        </p>
      </>
    );
  }

  return (
    <div className="receipt-print-root">
      <DocumentMeta title="Kvitto" robots="noindex,nofollow" />
      <ReceiptDocument order={order} formatMoney={formatMoney} />
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
  const payment = orderPaymentReceiptLabel(order.paymentMethod);

  return (
    <div className="receipt-stage bg-white px-0 py-0">
      <article className="receipt-paper mx-auto w-full max-w-[32rem] bg-white text-[15px] leading-relaxed text-[#222]">
        <div className="flex items-start justify-between gap-3 px-6 pb-4 pt-5">
          <span className="text-[13px] font-bold text-[#222]">Kvitto</span>
          <span className="text-right text-[13px] font-semibold text-[#a3a3a3]">
            {formatReceiptDateTime(order.createdAt)}
          </span>
        </div>

        <div className="mx-6 border-t border-[#ddd]" />

        <header className="px-6 pb-6 pt-6 text-center">
          <img
            src={logoMark}
            alt=""
            className="mx-auto mb-4 h-20 w-auto brightness-0"
            width={80}
            height={80}
          />
          <h1 className="text-[20px] font-bold tracking-tight text-[#111]">{MERCHANT.legalName}</h1>
          <p className="mt-2 text-[13px] text-[#666]">
            {MERCHANT.store.street} {MERCHANT.store.city}, {MERCHANT.store.postalCode}
          </p>
          <a
            href={SITE.url}
            className="mt-1.5 inline-block text-[13px] text-[#2f6fed] underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {siteHost}
          </a>
        </header>

        <div className="mx-6 border-t border-[#ddd]" />

        <section className="px-6 py-5">
          <ul className="space-y-4">
            {order.lines.map((line) => (
              <li key={line.productId}>
                <div className="flex items-start justify-between gap-3">
                  <span className="font-medium text-[#222]">{line.name}</span>
                  <span className="shrink-0 tabular-nums text-[#222]">
                    {formatMoney(line.unitPrice * line.quantity)}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-[#888]">
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
                <p className="mt-1 text-[13px] text-[#888]">1 x {formatPlainAmount(order.shipping)}</p>
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

        <div className="mx-6 border-t border-[#ddd]" />

        <section className="space-y-2 px-6 py-5 text-right">
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

        <section
          className="receipt-pay-box mx-6 mb-6 border border-[#d4d4d4] px-4 py-4"
          style={{ backgroundColor: '#efefef' }}
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#888]">Köp</p>
          <div className="mt-2 flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-[#222]">
                {payment.title} — {payment.detail}
              </p>
              {order.shippingAddress?.fullName ? (
                <p className="mt-2 text-[13px] font-medium text-[#222]">
                  {order.shippingAddress.fullName}
                </p>
              ) : null}
              {order.shippingAddress ? (
                <p className="mt-0.5 text-[12px] leading-relaxed text-[#777]">
                  {formatAddress(order.shippingAddress)}
                </p>
              ) : null}
              {order.email ? <p className="mt-1.5 text-[12px] text-[#999]">{order.email}</p> : null}
              {order.paymentSessionId ? (
                <p className="mt-3 text-[13px] font-bold tracking-wide text-[#222]">
                  Ref.nr: {order.paymentSessionId}
                </p>
              ) : null}
            </div>
            <p className="shrink-0 font-bold tabular-nums text-[#222]">{formatMoney(order.total)}</p>
          </div>
        </section>

        <footer className="px-6 pb-8 pt-2 text-center">
          <p className="text-[15px] font-bold text-[#222]">
            Tack för ditt köp hos {MERCHANT.legalName}!
          </p>
          <div className="mt-5 border-t border-[#ddd]" />
          <div className="mt-5 space-y-1.5 text-[11px] leading-relaxed text-[#777]">
            <p>
              ● {MERCHANT.legalName} ● {MERCHANT.phoneDisplay} ● {MERCHANT.receiptEmail}
            </p>
            <p>
              ● Org. nr: {MERCHANT.organisationNumber} ● Momsreg.nr: {MERCHANT.vatNumber}
            </p>
          </div>
        </footer>
      </article>
    </div>
  );
}
