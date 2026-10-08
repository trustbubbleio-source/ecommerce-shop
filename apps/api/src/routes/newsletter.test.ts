import { describe, expect, it } from 'vitest';
import { jsonRequest, makeApp } from '../test/helpers.js';

describe('POST /api/newsletter', () => {
  it('saves a new address and accepts a repeat signup', async () => {
    const { app } = makeApp();
    const first = await jsonRequest(app, 'POST', '/api/newsletter', { email: 'Ash@Pallet.town' });
    expect(first.res.status).toBe(200);
    expect(first.data.ok).toBe(true);

    const again = await jsonRequest(app, 'POST', '/api/newsletter', { email: 'ash@pallet.town' });
    expect(again.res.status).toBe(200);
  });

  it('rejects an invalid email', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(app, 'POST', '/api/newsletter', { email: 'nope' });
    expect(res.status).toBe(400);
  });
});
