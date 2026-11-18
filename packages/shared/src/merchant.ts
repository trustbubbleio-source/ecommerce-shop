import type { PaymentMethod } from './types.js';

/** Public merchant identity for receipts / invoices (keep in sync with web SITE). */
export const MERCHANT = {
  legalName: 'One More Rip',
  organisationNumber: '920108-4937',
  vatNumber: 'SE920108493701',
  email: 'orders@onemorerip.cards',
  /** Public contact shown on digital receipts (matches Zettle footer). */
  receiptEmail: 'to@onemorerip.cards',
  phoneDisplay: '+46 73 688 63 30',
  store: {
    street: 'Hallandsvägen 21',
    postalCode: '269 36',
    city: 'Båstad',
    country: 'Sweden',
    line: 'Hallandsvägen 21, 269 36 Båstad, Sweden',
  },
} as const;

/** Absolute path to the printable web receipt for an order. */
export function orderReceiptPath(orderId: string): string {
  return `/account/orders/${encodeURIComponent(orderId)}/receipt`;
}

export function orderReceiptUrl(webOrigin: string, orderId: string): string {
  const base = webOrigin.replace(/\/$/, '');
  // `print=1` opens the system print dialog as soon as the receipt is ready.
  return `${base}${orderReceiptPath(orderId)}?print=1`;
}

/** Swedish receipt labels for the online payment method. */
export function orderPaymentReceiptLabel(method?: PaymentMethod | null): {
  title: string;
  detail: string;
} {
  switch (method) {
    case 'google_pay':
      return { title: 'Onlinebetalning', detail: 'Google Pay' };
    case 'apple_pay':
      return { title: 'Onlinebetalning', detail: 'Apple Pay' };
    case 'card':
      return { title: 'Onlinebetalning', detail: 'Kort' };
    case 'paypal':
      return { title: 'Onlinebetalning', detail: 'PayPal' };
    case 'swish':
      return { title: 'Onlinebetalning', detail: 'Swish' };
    case 'redirect':
    default:
      return { title: 'Onlinebetalning', detail: 'PayPal Checkout' };
  }
}
