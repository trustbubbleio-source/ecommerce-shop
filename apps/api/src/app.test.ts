import { describe, expect, it } from 'vitest';
import { jsonRequest, makeApp } from './test/helpers.js';

describe('app', () => {
  it('reports health with the payment mode', async () => {
    const { app } = makeApp();
    const { res, data } = await jsonRequest(app, 'GET', '/api/health');
    expect(res.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.stripe).toBe('mock');
  });

  it('returns JSON 404 for unknown routes', async () => {
    const { app } = makeApp();
    const { res, data } = await jsonRequest(app, 'GET', '/api/nope');
    expect(res.status).toBe(404);
    expect(data.error).toBe('Not found');
  });

  it('sets CORS headers for the configured origin', async () => {
    const { app } = makeApp();
    const res = await app.request('/api/health', {
      headers: { origin: 'http://localhost:5173' },
    });
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
  });
});

describe('repositories edge cases', () => {
  it('attachSession is a no-op for a missing order', async () => {
    const { deps } = makeApp();
    await expect(deps.orders.attachSession('ord_missing', 'cs_x')).resolves.toBeUndefined();
    await expect(deps.orders.markStatusBySession('cs_x', 'paid')).resolves.toBeUndefined();
  });

  it('setStatus returns undefined for a missing order', async () => {
    const { deps } = makeApp();
    await expect(deps.orders.setStatus('ord_missing', 'paid')).resolves.toBeUndefined();
  });
});
