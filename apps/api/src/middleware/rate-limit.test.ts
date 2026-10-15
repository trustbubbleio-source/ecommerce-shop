import { MemoryRateLimiter } from '@akknerds/rate-limit';
import { describe, expect, it } from 'vitest';
import { makeApp } from '../test/helpers.js';
import { clientIp } from './rate-limit.js';

describe('clientIp', () => {
  it('prefers x-real-ip, then rightmost x-forwarded-for hop', () => {
    expect(clientIp(new Headers({ 'x-real-ip': '3.3.3.3' }))).toBe('3.3.3.3');
    expect(clientIp(new Headers({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }))).toBe('2.2.2.2');
    expect(clientIp(new Headers({ 'cf-connecting-ip': '4.4.4.4' }))).toBe('4.4.4.4');
    expect(clientIp(new Headers())).toBe('unknown');
  });
});

describe('rateLimit middleware', () => {
  it('returns 429 on contact after the preset is exceeded', async () => {
    const limiter = new MemoryRateLimiter();
    const { app } = makeApp({ rateLimiter: limiter });

    for (let i = 0; i < 5; i++) {
      const res = await app.request('/api/contact', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '9.9.9.9',
        },
        body: JSON.stringify({
          name: 'Ash',
          email: 'ash@pallet.town',
          subject: 'Hello',
          message: 'This is a long enough contact message.',
        }),
      });
      expect(res.status).toBe(200);
    }

    const blocked = await app.request('/api/contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '9.9.9.9',
      },
      body: JSON.stringify({
        name: 'Ash',
        email: 'ash@pallet.town',
        subject: 'Hello again',
        message: 'This is a long enough contact message.',
      }),
    });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBeTruthy();
  });
});
