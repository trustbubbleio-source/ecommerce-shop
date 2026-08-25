import { describe, expect, it } from 'vitest';
import { makeApp, registerAndLogin } from '../test/helpers.js';

/** Minimal valid 1×1 PNG. */
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

describe('sell API', () => {
  it('requires auth', async () => {
    const { app } = makeApp();
    const form = new FormData();
    form.append(
      'payload',
      JSON.stringify({ items: [{ title: 'Pikachu', notes: '', condition: 'NM' }] }),
    );
    const res = await app.request('/api/sell', { method: 'POST', body: form });
    expect(res.status).toBe(401);
  });

  it('accepts a member sell request with a validated photo attachment', async () => {
    const created = makeApp();
    const token = await registerAndLogin(created, 'seller@pallet.town');

    const form = new FormData();
    form.append(
      'payload',
      JSON.stringify({
        notes: 'Bulk from binder',
        items: [
          { title: 'Charizard ex', notes: 'JP', condition: 'NM' },
          { title: 'Pikachu', notes: '', condition: 'LP' },
        ],
      }),
    );
    form.append('photo_0', new File([PNG_1X1], 'charizard.png', { type: 'image/png' }));

    const res = await created.app.request('/api/sell', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it('rejects non jpeg/png/webp payloads even if the mime claims otherwise', async () => {
    const created = makeApp();
    const token = await registerAndLogin(created, 'fakefile@pallet.town');
    const form = new FormData();
    form.append(
      'payload',
      JSON.stringify({ items: [{ title: 'Fake', notes: '', condition: '' }] }),
    );
    form.append(
      'photo_0',
      new File([Buffer.from('not-an-image')], 'evil.png', { type: 'image/png' }),
    );

    const res = await created.app.request('/api/sell', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: form,
    });
    expect(res.status).toBe(400);
  });
});
