import { describe, expect, it } from 'vitest';
import type { Order } from '@akknerds/shared';
import { ordersToCsv } from './orders-csv';

const sample: Order = {
  id: 'ord_1',
  email: 'admin@test.local',
  lines: [{ productId: 'p1', name: 'Charizard EX', unitPrice: 2500, quantity: 1 }],
  subtotal: 2500,
  shipping: 0,
  total: 2500,
  currency: 'eur',
  status: 'fulfilled',
  channel: 'in_store',
  fulfillmentStep: 'delivered',
  createdAt: '2026-10-23T12:00:00.000Z',
};

describe('ordersToCsv', () => {
  it('includes channel and line totals for Excel', () => {
    const csv = ordersToCsv([sample]);
    expect(csv).toContain('channel');
    expect(csv).toContain('in_store');
    expect(csv).toContain('Charizard EX');
    expect(csv).toContain('2500');
  });
});
