import { describe, expect, it } from 'vitest';
import { jsonRequest, makeApp, registerAndLogin } from '../test/helpers.js';

describe('favorites API', () => {
  it('requires auth', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(app, 'GET', '/api/favorites');
    expect(res.status).toBe(401);
  });

  it('adds, lists, and removes a favorite', async () => {
    const created = makeApp();
    const token = await registerAndLogin(created, 'fan@pallet.town');
    const headers = { authorization: `Bearer ${token}` };

    const add = await jsonRequest(created.app, 'POST', '/api/favorites/bb-151', undefined, headers);
    expect(add.res.status).toBe(201);
    expect(add.data.productIds).toContain('bb-151');

    const list = await jsonRequest(created.app, 'GET', '/api/favorites', undefined, headers);
    expect(list.res.status).toBe(200);
    expect(list.data.products.some((p: { id: string }) => p.id === 'bb-151')).toBe(true);

    const ids = await jsonRequest(created.app, 'GET', '/api/favorites/ids', undefined, headers);
    expect(ids.data.productIds).toContain('bb-151');

    const remove = await jsonRequest(
      created.app,
      'DELETE',
      '/api/favorites/bb-151',
      undefined,
      headers,
    );
    expect(remove.res.status).toBe(200);
    expect(remove.data.productIds).not.toContain('bb-151');
  });

  it('returns 404 when favoriting an unknown product', async () => {
    const created = makeApp();
    const token = await registerAndLogin(created, 'fan2@pallet.town');
    const { res } = await jsonRequest(created.app, 'POST', '/api/favorites/missing-id', undefined, {
      authorization: `Bearer ${token}`,
    });
    expect(res.status).toBe(404);
  });
});
