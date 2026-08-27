import {
  FREE_SHIPPING_THRESHOLD,
  formatMoney,
  hasCarrierTracking,
  defaultFulfillmentStep,
  FULFILLMENT_STEP_LABELS,
  type Address,
  type FulfillmentStep,
  type Order,
  type OrderStatus,
} from '@akknerds/shared';
import type { BadgeProps } from '@akknerds/ui';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Awaiting payment',
  paid: 'Confirmed',
  fulfilled: 'Delivered',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_VARIANT: Record<OrderStatus, BadgeProps['variant']> = {
  pending: 'muted',
  paid: 'success',
  fulfilled: 'default',
  cancelled: 'destructive',
};

export function orderOpsLabel(order: Pick<Order, 'status' | 'fulfillmentStep'>): string {
  if (order.status === 'pending' || order.status === 'cancelled') {
    return ORDER_STATUS_LABEL[order.status];
  }
  const step = order.fulfillmentStep ?? defaultFulfillmentStep(order.status);
  return step ? FULFILLMENT_STEP_LABELS[step] : ORDER_STATUS_LABEL[order.status];
}

/** Admin Orders queue tabs. */
export type AdminOrderTab = 'all' | 'pack' | 'deliver' | 'finished' | 'unpaid' | 'inactive';

export const ADMIN_ORDER_TABS: { id: AdminOrderTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pack', label: 'Need to pack' },
  { id: 'deliver', label: 'Deliver today' },
  { id: 'finished', label: 'Finished' },
  { id: 'unpaid', label: 'Awaiting payment' },
  { id: 'inactive', label: 'Rejected / inactive' },
];

export function adminOrderTabOf(
  order: Pick<Order, 'status' | 'fulfillmentStep'>,
): Exclude<AdminOrderTab, 'all'> {
  if (order.status === 'cancelled') return 'inactive';
  if (order.status === 'pending') return 'unpaid';
  const step = order.fulfillmentStep ?? defaultFulfillmentStep(order.status);
  if (step === 'delivered' || order.status === 'fulfilled') return 'finished';
  if (step === 'awaiting_pickup' || step === 'handed_to_carrier' || step === 'in_transit') {
    return 'deliver';
  }
  return 'pack';
}

export function orderMatchesAdminTab(
  order: Pick<Order, 'status' | 'fulfillmentStep'>,
  tab: AdminOrderTab,
): boolean {
  return tab === 'all' || adminOrderTabOf(order) === tab;
}

export const ORDER_STEPS = [
  {
    id: 'received',
    label: 'Received',
    description: 'Your order is confirmed and on our system.',
  },
  {
    id: 'packing',
    label: 'Packing',
    description: "We're preparing your items at the Båstad warehouse.",
  },
  {
    id: 'awaiting_pickup',
    label: 'Awaiting pickup',
    description: 'Packed and checked. Waiting for the carrier to collect.',
  },
  {
    id: 'handed_to_carrier',
    label: 'Handed to carrier',
    description: 'The parcel has left us and is with the courier.',
  },
  {
    id: 'in_transit',
    label: 'In transit',
    description: 'On the way to your delivery address.',
  },
  {
    id: 'delivered',
    label: 'Delivered',
    description: 'At your doorstep.',
  },
] as const;

export type OrderStepId = (typeof ORDER_STEPS)[number]['id'];

export interface OrderTimelineState {
  /** Index of the current step, or -1 when cancelled. */
  currentIndex: number;
  completedCount: number;
}

const FULFILLMENT_INDEX: Record<FulfillmentStep, number> = {
  packing: 1,
  awaiting_pickup: 2,
  handed_to_carrier: 3,
  in_transit: 4,
  delivered: 5,
};

export function orderTimeline(
  status: OrderStatus,
  fulfillmentStep?: FulfillmentStep | null,
): OrderTimelineState {
  if (status === 'cancelled') return { currentIndex: -1, completedCount: 0 };
  if (status === 'pending') return { currentIndex: 0, completedCount: 0 };
  const step = fulfillmentStep ?? defaultFulfillmentStep(status) ?? 'packing';
  if (step === 'delivered' || status === 'fulfilled') {
    return { currentIndex: 5, completedCount: 6 };
  }
  const currentIndex = FULFILLMENT_INDEX[step];
  return { currentIndex, completedCount: currentIndex };
}

export function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function orderItemCount(order: Order): number {
  return order.lines.reduce((n, line) => n + line.quantity, 0);
}

export function orderHeadline(order: Order): string {
  const first = order.lines[0]?.name;
  if (!first) return 'Order';
  const extra = order.lines.length - 1;
  if (extra <= 0) return first;
  return `${first} + ${extra} more`;
}

export function formatAddress(address: Address): string {
  return [address.line1, address.line2, `${address.postalCode} ${address.city}`, address.country]
    .filter(Boolean)
    .join(', ');
}

export function orderInvoiceLink(order: Order): { href: string; label: string } | null {
  const href = order.invoiceUrl?.trim();
  if (!href) return null;
  return {
    href,
    label: href.includes('/invoice/') ? 'Invoice.pdf' : 'Receipt',
  };
}

export interface OrderCarrierDetails {
  tracked: boolean;
  carrierName: string;
  trackingUrl: string | null;
  trackingDisplay: string;
  note: string;
}

function safeHttpUrl(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function orderCarrierDetails(order: Order): OrderCarrierDetails {
  if (order.status === 'cancelled') {
    return {
      tracked: false,
      carrierName: '—',
      trackingUrl: null,
      trackingDisplay: '—',
      note: 'This order was cancelled, so no carrier handover applies.',
    };
  }

  const tracked = hasCarrierTracking(order.subtotal, order.currency);
  const threshold = formatMoney(FREE_SHIPPING_THRESHOLD, order.currency);

  if (!tracked) {
    return {
      tracked: false,
      carrierName: 'Untracked postal',
      trackingUrl: null,
      trackingDisplay: 'Not included',
      note: `Orders under ${threshold} ship without a carrier tracking number. Follow packing and delivery on this page — that is the live status for this shipment.`,
    };
  }

  const trackingUrl = safeHttpUrl(order.trackingUrl);
  const carrierName = order.carrierName?.trim() || 'Assigned at dispatch';

  if (trackingUrl) {
    return {
      tracked: true,
      carrierName,
      trackingUrl,
      trackingDisplay: trackingUrl,
      note: 'Use the carrier link for live courier updates. Warehouse progress from Båstad still shows on this page.',
    };
  }

  return {
    tracked: true,
    carrierName,
    trackingUrl: null,
    trackingDisplay: 'Issued when the parcel is collected',
    note: `Tracked courier service is included on orders of ${threshold} and above. Carrier name and tracking URL appear here when the parcel is collected.`,
  };
}
