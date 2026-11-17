import { FileText } from 'lucide-react';
import { orderInvoiceLink } from '../../lib/order-progress';
import type { Order } from '@akknerds/shared';
import { cn } from '@akknerds/ui';

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
      // Shop receipts open in the same tab and immediately trigger print.
      target={shopReceipt ? undefined : '_blank'}
      rel={shopReceipt ? undefined : 'noreferrer'}
      className={cn(
        'text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline',
        className,
      )}
      onClick={(event) => event.stopPropagation()}
    >
      <FileText className="size-3.5" aria-hidden />
      {link.label}
    </a>
  );
}
