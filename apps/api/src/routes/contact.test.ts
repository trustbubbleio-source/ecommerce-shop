import { describe, expect, it, vi } from 'vitest';
import { jsonRequest, makeApp } from '../test/helpers.js';

describe('POST /api/contact', () => {
  it('accepts a valid message', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    const { app } = makeApp();
    const { res, data } = await jsonRequest(app, 'POST', '/api/contact', {
      name: 'Ash',
      email: 'ash@pallet.town',
      subject: 'Shipping question',
      message: 'How long does delivery take to Switzerland?',
    });
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it('rejects an invalid message', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(app, 'POST', '/api/contact', {
      name: '',
      email: 'bad',
      subject: '',
      message: 'short',
    });
    expect(res.status).toBe(400);
  });
});
