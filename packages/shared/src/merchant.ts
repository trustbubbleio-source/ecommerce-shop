/** Public merchant identity for receipts / invoices (keep in sync with web SITE). */
export const MERCHANT = {
  legalName: 'One More Rip',
  organisationNumber: '920108-4937',
  vatNumber: 'SE920108493701',
  email: 'orders@onemorerip.cards',
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
