import { describe, expect, it, vi } from 'vitest';
import { hashPassword } from '../lib/password.js';
import { jsonRequest, makeApp, registerAndLogin, TEST_SHIPPING_ADDRESS } from '../test/helpers.js';

const adminCreds = { name: 'Admin', email: 'admin-ntf@test.local', password: 'adminpass123' };

async function seedAdmin(deps: Awaited<ReturnType<typeof makeApp>>['deps']) {
  const passwordHash = await hashPassword(adminCreds.password);
  return deps.users.create({
    ...adminCreds,
    passwordHash,
    role: 'admin',
    emailVerifiedAt: new Date().toISOString(),
  });
}

async function loginAdmin(app: ReturnType<typeof makeApp>['app']) {
  const { data } = await jsonRequest(app, 'POST', '/api/auth/login', {
    email: adminCreds.email,
    password: adminCreds.password,
  });
  return data.token as string;
}

describe('GET /api/notifications', () => {
  it('requires authentication', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(app, 'GET', '/api/notifications');
    expect(res.status).toBe(401);
  });

  it('lists order updates after an admin fulfillment change', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const created = makeApp();
    await seedAdmin(created.deps);
    const adminToken = await loginAdmin(created.app);
    const customerToken = await registerAndLogin(created, 'notify-me@example.com');

    const checkout = await jsonRequest(
      created.app,
      'POST',
      '/api/checkout',
      {
        email: 'notify-me@example.com',
        items: [{ productId: 'bb-151', quantity: 1 }],
        shippingAddress: TEST_SHIPPING_ADDRESS,
      },
      { authorization: `Bearer ${customerToken}` },
    );
    const orderId = checkout.data.orderId as string;

    const patch = await jsonRequest(
      created.app,
      'PATCH',
      `/api/admin/orders/${orderId}`,
      { fulfillmentStep: 'awaiting_pickup' },
      { authorization: `Bearer ${adminToken}` },
    );
    expect(patch.res.status).toBe(200);

    const { res, data } = await jsonRequest(created.app, 'GET', '/api/notifications', undefined, {
      authorization: `Bearer ${customerToken}`,
    });
    expect(res.status).toBe(200);
    expect(data.unreadCount).toBe(1);
    expect(data.notifications).toHaveLength(1);
    expect(data.notifications[0].type).toBe('order_updated');
    expect(data.notifications[0].href).toBe(`/account/orders/${orderId}`);
    expect(data.notifications[0].title).toMatch(/awaiting pickup/i);

    const read = await jsonRequest(
      created.app,
      'POST',
      '/api/notifications/read',
      {},
      { authorization: `Bearer ${customerToken}` },
    );
    expect(read.res.status).toBe(200);
    expect(read.data.unreadCount).toBe(0);
    info.mockRestore();
  });
});
