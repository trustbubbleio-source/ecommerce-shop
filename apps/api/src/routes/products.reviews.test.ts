import { describe, expect, it } from 'vitest';
import { jsonRequest, makeApp, registerAndLogin } from '../test/helpers.js';

async function seedPaidOrder(
  created: ReturnType<typeof makeApp>,
  userId: string,
  productId: string,
  email: string,
) {
  const order = await created.deps.orders.create({
    email,
    userId,
    lines: [{ productId, name: 'Test product', unitPrice: 1000, quantity: 1 }],
    subtotal: 1000,
    shipping: 0,
    total: 1000,
    currency: 'eur',
  });
  await created.deps.orders.setStatus(order.id, 'paid');
  return order;
}

describe('product reviews API', () => {
  it('requires auth to list reviews', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(app, 'GET', '/api/products/bb-151/reviews');
    expect(res.status).toBe(401);
  });

  it('lists reviews for signed-in members and allows buyers to post', async () => {
    const created = makeApp();
    const token = await registerAndLogin(created, 'buyer@pallet.town');
    const headers = { authorization: `Bearer ${token}` };
    const me = await jsonRequest(created.app, 'GET', '/api/auth/me', undefined, headers);
    const userId = me.data.user.id as string;

    await seedPaidOrder(created, userId, 'bb-151', 'buyer@pallet.town');

    const empty = await jsonRequest(
      created.app,
      'GET',
      '/api/products/bb-151/reviews',
      undefined,
      headers,
    );
    expect(empty.res.status).toBe(200);
    expect(empty.data.reviews).toEqual([]);
    expect(empty.data.canReview).toBe(true);

    const create = await jsonRequest(
      created.app,
      'POST',
      '/api/products/bb-151/reviews',
      { rating: 5, body: 'Great pulls and fast shipping!' },
      headers,
    );
    expect(create.res.status).toBe(201);
    expect(create.data.review.rating).toBe(5);
    expect(create.data.review.body).toContain('Great pulls');

    const listed = await jsonRequest(
      created.app,
      'GET',
      '/api/products/bb-151/reviews',
      undefined,
      headers,
    );
    expect(listed.data.reviews).toHaveLength(1);
    expect(listed.data.canReview).toBe(false);
    expect(listed.data.myReview.id).toBe(create.data.review.id);

    const product = await jsonRequest(created.app, 'GET', '/api/products/bb-151');
    expect(product.data.product.reviewCount).toBeGreaterThanOrEqual(1);
    expect(product.data.product.rating).toBe(5);
  });

  it('rejects reviews from users who have not purchased the product', async () => {
    const created = makeApp();
    const token = await registerAndLogin(created, 'lurker@pallet.town');
    const { res, data } = await jsonRequest(
      created.app,
      'POST',
      '/api/products/bb-151/reviews',
      { rating: 4, body: 'Looks cool but I did not buy it yet.' },
      { authorization: `Bearer ${token}` },
    );
    expect(res.status).toBe(403);
    expect(data.error).toMatch(/verified buyers/i);
  });

  it('rejects a second review from the same buyer', async () => {
    const created = makeApp();
    const token = await registerAndLogin(created, 'twice@pallet.town');
    const headers = { authorization: `Bearer ${token}` };
    const me = await jsonRequest(created.app, 'GET', '/api/auth/me', undefined, headers);
    await seedPaidOrder(created, me.data.user.id, 'bb-151', 'twice@pallet.town');

    const first = await jsonRequest(
      created.app,
      'POST',
      '/api/products/bb-151/reviews',
      { rating: 4, body: 'Solid box, would buy again soon.' },
      headers,
    );
    expect(first.res.status).toBe(201);

    const second = await jsonRequest(
      created.app,
      'POST',
      '/api/products/bb-151/reviews',
      { rating: 5, body: 'Trying to review this product again.' },
      headers,
    );
    expect(second.res.status).toBe(409);
  });
});
