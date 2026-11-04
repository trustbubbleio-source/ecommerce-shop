import { describe, expect, it } from 'vitest';
import { createMemoryRepositories } from '../repositories/factory.js';
import { enrichOrderForPacking } from './order-packing.js';

describe('enrichOrderForPacking', () => {
  it('attaches product snapshots and null for missing ids', async () => {
    const { products, orders } = createMemoryRepositories();
    const order = await orders.create({
      email: 'buyer@example.com',
      lines: [
        { productId: 'bb-151', name: '151 Booster Box', unitPrice: 16999, quantity: 1 },
        { productId: 'gone', name: 'Deleted card', unitPrice: 100, quantity: 1 },
      ],
      subtotal: 17099,
      shipping: 0,
      total: 17099,
      currency: 'eur',
    });

    const enriched = await enrichOrderForPacking(products, order);
    expect(enriched.lines[0]?.product?.category).toBe('booster-box');
    expect(enriched.lines[0]?.product?.set).toBeTruthy();
    expect(enriched.lines[1]?.product).toBeNull();
  });
});
