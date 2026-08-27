import type { Order } from '@akknerds/shared';
import { ExternalLink, Truck } from 'lucide-react';
import { orderCarrierDetails } from '../../lib/order-progress';

interface OrderCarrierDetailsProps {
  order: Order;
}

export function OrderCarrierDetails({ order }: OrderCarrierDetailsProps) {
  const details = orderCarrierDetails(order);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Truck className="text-muted-foreground size-4" aria-hidden />
        <h3 className="text-sm font-semibold">Carrier details</h3>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
        <dt className="text-muted-foreground">Carrier</dt>
        <dd className="text-foreground font-medium">{details.carrierName}</dd>
        <dt className="text-muted-foreground">Tracking URL</dt>
        <dd>
          {details.trackingUrl ? (
            <a
              href={details.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary inline-flex items-center gap-1 font-medium break-all hover:underline"
            >
              {details.trackingUrl}
              <ExternalLink className="size-3.5 shrink-0" aria-hidden />
            </a>
          ) : (
            <span className="text-foreground font-medium">{details.trackingDisplay}</span>
          )}
        </dd>
      </dl>
      <p className="text-muted-foreground text-xs leading-relaxed">{details.note}</p>
    </div>
  );
}
