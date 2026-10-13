import { describe, expect, it } from 'vitest';
import { hashPassword } from '../lib/password.js';
import { jsonRequest, makeApp } from '../test/helpers.js';

function jpegBytes(): Buffer {
  return Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9,
  ]);
}

describe('restoration routes', () => {
  it('accepts a public photo assessment and lists it for admin', async () => {
    const created = makeApp();

    const form = new FormData();
    form.set(
      'payload',
      JSON.stringify({
        email: 'collector@example.com',
        notes: 'Light binder bend on Charizard',
        packageInterest: 'clean-prep',
      }),
    );
    form.set('photo_front', new File([jpegBytes()], 'front.jpg', { type: 'image/jpeg' }));
    form.set('photo_back', new File([jpegBytes()], 'back.jpg', { type: 'image/jpeg' }));

    const createRes = await created.app.request('/api/restoration', {
      method: 'POST',
      body: form,
    });
    expect(createRes.status).toBe(200);
    const createdBody = (await createRes.json()) as { ok: boolean; id: string };
    expect(createdBody.ok).toBe(true);
    expect(createdBody.id).toBeTruthy();

    const passwordHash = await hashPassword('adminpass123');
    await created.deps.users.create({
      name: 'Admin',
      email: 'rest-admin@pallet.town',
      passwordHash,
      role: 'admin',
      emailVerifiedAt: new Date().toISOString(),
    });
    const { data: login } = await jsonRequest(created.app, 'POST', '/api/auth/login', {
      email: 'rest-admin@pallet.town',
      password: 'adminpass123',
    });
    const adminHeaders = { authorization: `Bearer ${login.token}` };

    const all = await jsonRequest(
      created.app,
      'GET',
      '/api/admin/restoration',
      undefined,
      adminHeaders,
    );
    expect(all.res.status).toBe(200);
    expect(all.data.items.some((item: { id: string }) => item.id === createdBody.id)).toBe(true);

    const patch = await jsonRequest(
      created.app,
      'PATCH',
      `/api/admin/restoration/${createdBody.id}`,
      { status: 'reviewing' },
      adminHeaders,
    );
    expect(patch.res.status).toBe(200);
    expect(patch.data.item.status).toBe('reviewing');
  });

  it('requires a front photo', async () => {
    const { app } = makeApp();
    const form = new FormData();
    form.set('payload', JSON.stringify({ email: 'a@b.com', notes: '', packageInterest: 'unsure' }));
    form.set('photo_back', new File([jpegBytes()], 'back.jpg', { type: 'image/jpeg' }));

    const res = await app.request('/api/restoration', { method: 'POST', body: form });
    expect(res.status).toBe(400);
  });
});
