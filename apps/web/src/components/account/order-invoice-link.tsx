import { FileText } from 'lucide-react';
import type { Order } from '@akknerds/shared';
import { cn } from '@akknerds/ui';
import { orderInvoiceLink } from '../../lib/order-progress';
import { printShopReceipt } from '../../lib/print-shop-receipt';

interface OrderInvoiceLinkProps {
  order: Order;
  className?: string;
}

export function OrderInvoiceLink({ order, className }: OrderInvoiceLinkProps) {
  const link = orderInvoiceLink(order);
  if (!link) return null;

  const shopReceipt = link.href.includes('/receipt');

  return (
    <a
      href={link.href}
      target={shopReceipt ? undefined : '_blank'}
      rel={shopReceipt ? undefined : 'noreferrer'}
      className={cn(
        'text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline',
        className,
      )}
      onClick={(event) => {
        event.stopPropagation();
        if (!shopReceipt) return;
        event.preventDefault();
        printShopReceipt(link.href);
      }}
    >
      <FileText className="size-3.5" aria-hidden />
      {link.label}
    </a>
  );
}
