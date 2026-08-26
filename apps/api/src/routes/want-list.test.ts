import { describe, expect, it } from 'vitest';
import { hashPassword } from '../lib/password.js';
import { jsonRequest, makeApp, registerAndLogin } from '../test/helpers.js';

describe('want list API', () => {
  it('requires auth', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(app, 'GET', '/api/want-list');
    expect(res.status).toBe(401);
  });

  it('lets members create and list want items', async () => {
    const created = makeApp();
    const token = await registerAndLogin(created, 'want@pallet.town');
    const headers = { authorization: `Bearer ${token}` };

    const create = await jsonRequest(
      created.app,
      'POST',
      '/api/want-list',
      {
        preset: 'singles-nm-en',
        title: 'Charizard ex SIR',
        notes: 'Prefer PSA candidate',
      },
      headers,
    );
    expect(create.res.status).toBe(201);
    expect(create.data.item.preset).toBe('singles-nm-en');
    expect(create.data.item.status).toBe('pending');

    const list = await jsonRequest(created.app, 'GET', '/api/want-list', undefined, headers);
    expect(list.res.status).toBe(200);
    expect(list.data.items).toHaveLength(1);
  });

  it('lets admins list and update status', async () => {
    const created = makeApp();
    const memberToken = await registerAndLogin(created, 'want-admin@pallet.town');
    const memberHeaders = { authorization: `Bearer ${memberToken}` };

    const create = await jsonRequest(
      created.app,
      'POST',
      '/api/want-list',
      { preset: 'sealed-jp', title: '151 JP Booster Box', notes: '' },
      memberHeaders,
    );
    const id = create.data.item.id as string;

    const denied = await jsonRequest(created.app, 'GET', '/api/admin/want-list', undefined, memberHeaders);
    expect(denied.res.status).toBe(403);

    const passwordHash = await hashPassword('adminpass123');
    await created.deps.users.create({
      name: 'Admin',
      email: 'want-boss@pallet.town',
      passwordHash,
      role: 'admin',
      emailVerifiedAt: new Date().toISOString(),
    });
    const { data: login } = await jsonRequest(created.app, 'POST', '/api/auth/login', {
      email: 'want-boss@pallet.town',
      password: 'adminpass123',
    });
    const adminHeaders = { authorization: `Bearer ${login.token}` };

    const all = await jsonRequest(created.app, 'GET', '/api/admin/want-list', undefined, adminHeaders);
    expect(all.res.status).toBe(200);
    expect(all.data.items.some((item: { id: string }) => item.id === id)).toBe(true);

    const patch = await jsonRequest(
      created.app,
      'PATCH',
      `/api/admin/want-list/${id}`,
      { status: 'accepted' },
      adminHeaders,
    );
    expect(patch.res.status).toBe(200);
    expect(patch.data.item.status).toBe('accepted');
  });
});
