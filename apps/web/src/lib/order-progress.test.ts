import { describe, expect, it } from 'vitest';
import type { Order } from '@akknerds/shared';
import {
  adminOrderTabOf,
  orderCarrierDetails,
  orderHeadline,
  orderInvoiceLink,
  orderItemCount,
  orderTimeline,
} from './order-progress';

const order: Order = {
  id: 'ord_1',
  email: 'ash@pallet.town',
  lines: [
    { productId: 'a', name: 'Lost Origin Booster box', unitPrice: 75000, quantity: 1 },
    { productId: 'b', name: 'Pack', unitPrice: 500, quantity: 2 },
  ],
  subtotal: 76000,
  shipping: 0,
  total: 76000,
  currency: 'eur',
  status: 'paid',
  createdAt: '2026-08-27T00:00:00.000Z',
};

describe('orderTimeline', () => {
  it('marks received as current while awaiting payment', () => {
    expect(orderTimeline('pending')).toEqual({ currentIndex: 0, completedCount: 0 });
  });

  it('completes received after payment and moves to packing', () => {
    expect(orderTimeline('paid')).toEqual({ currentIndex: 1, completedCount: 1 });
  });

  it('advances when admin sets awaiting pickup', () => {
    expect(orderTimeline('paid', 'awaiting_pickup')).toEqual({ currentIndex: 2, completedCount: 2 });
  });

  it('completes the full path when fulfilled', () => {
    expect(orderTimeline('fulfilled')).toEqual({ currentIndex: 5, completedCount: 6 });
  });

  it('has no active step when cancelled', () => {
    expect(orderTimeline('cancelled')).toEqual({ currentIndex: -1, completedCount: 0 });
  });
});

describe('adminOrderTabOf', () => {
  it('puts a paid order in Need to pack', () => {
    expect(adminOrderTabOf({ status: 'paid', fulfillmentStep: 'packing' })).toBe('pack');
    expect(adminOrderTabOf({ status: 'paid' })).toBe('pack');
  });

  it('puts carrier steps in Deliver today', () => {
    expect(adminOrderTabOf({ status: 'paid', fulfillmentStep: 'awaiting_pickup' })).toBe('deliver');
    expect(adminOrderTabOf({ status: 'paid', fulfillmentStep: 'in_transit' })).toBe('deliver');
  });

  it('splits finished, unpaid, and cancelled', () => {
    expect(adminOrderTabOf({ status: 'fulfilled' })).toBe('finished');
    expect(adminOrderTabOf({ status: 'pending' })).toBe('unpaid');
    expect(adminOrderTabOf({ status: 'cancelled' })).toBe('inactive');
  });
});

describe('orderHeadline', () => {
  it('names a single line', () => {
    expect(orderHeadline({ ...order, lines: order.lines.slice(0, 1) })).toBe(
      'Lost Origin Booster box',
    );
  });

  it('adds a more-count for extra lines', () => {
    expect(orderHeadline(order)).toBe('Lost Origin Booster box + 1 more');
  });

  it('counts units across lines', () => {
    expect(orderItemCount(order)).toBe(3);
  });
});

describe('orderCarrierDetails', () => {
  it('includes pending carrier tracking on paid orders at or above 75 EUR', () => {
    const details = orderCarrierDetails(order);
    expect(details.tracked).toBe(true);
    expect(details.carrierName).toBe('Assigned at dispatch');
    expect(details.trackingUrl).toBeNull();
    expect(details.trackingDisplay).toMatch(/collected/i);
  });

  it('shows a live tracking link when the carrier has collected', () => {
    const details = orderCarrierDetails({
      ...order,
      carrierName: 'PostNord',
      trackingUrl: 'https://tracking.postnord.com/abc',
    });
    expect(details.carrierName).toBe('PostNord');
    expect(details.trackingUrl).toBe('https://tracking.postnord.com/abc');
  });

  it('omits carrier tracking below 75 EUR', () => {
    const details = orderCarrierDetails({
      ...order,
      subtotal: 7499,
      shipping: 599,
      total: 8098,
    });
    expect(details.tracked).toBe(false);
    expect(details.carrierName).toBe('Untracked postal');
    expect(details.trackingDisplay).toBe('Not included');
    expect(details.note).toMatch(/without a carrier tracking number/);
  });
});

describe('orderInvoiceLink', () => {
  it('labels Stripe invoice PDFs', () => {
    expect(
      orderInvoiceLink({
        ...order,
        invoiceUrl: 'https://pay.stripe.com/invoice/acct/inv_1/pdf',
      }),
    ).toEqual({
      href: 'https://pay.stripe.com/invoice/acct/inv_1/pdf',
      label: 'Invoice.pdf',
    });
  });

  it('labels hosted receipts for older charges', () => {
    expect(
      orderInvoiceLink({
        ...order,
        invoiceUrl: 'https://pay.stripe.com/receipts/payment/abc',
      })?.label,
    ).toBe('Receipt');
  });

  it('hides the link when Stripe has not issued a document yet', () => {
    expect(orderInvoiceLink(order)).toBeNull();
  });
});
