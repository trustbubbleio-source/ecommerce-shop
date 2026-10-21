import { describe, expect, it } from 'vitest';
import { jsonRequest, makeApp } from '../test/helpers.js';

describe('POST /api/newsletter', () => {
  it('requires marketing consent', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(app, 'POST', '/api/newsletter', {
      email: 'ash@pallet.town',
    });
    expect(res.status).toBe(400);
  });

  it('saves a new address and accepts a repeat signup', async () => {
    const { app, deps } = makeApp();
    const first = await jsonRequest(app, 'POST', '/api/newsletter', {
      email: 'Ash@Pallet.town',
      consent: true,
    });
    expect(first.res.status).toBe(200);
    expect(first.data.ok).toBe(true);

    const again = await jsonRequest(app, 'POST', '/api/newsletter', {
      email: 'ash@pallet.town',
      consent: true,
    });
    expect(again.res.status).toBe(200);

    const token = (await deps.newsletter.subscribe('ash@pallet.town')).unsubscribeToken;
    const unsub = await jsonRequest(app, 'POST', '/api/newsletter/unsubscribe', { token });
    expect(unsub.res.status).toBe(200);
    expect(unsub.data.removed).toBe(true);
  });

  it('rejects an invalid email', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(app, 'POST', '/api/newsletter', {
      email: 'nope',
      consent: true,
    });
    expect(res.status).toBe(400);
  });
});
