import { describe, expect, it } from 'vitest';
import { MemoryRateLimiter } from './limiter.js';

describe('MemoryRateLimiter', () => {
  it('allows requests under the limit and then blocks', () => {
    let now = 1_000;
    const limiter = new MemoryRateLimiter(() => now);
    const rule = { limit: 2, windowMs: 1_000 };

    expect(limiter.check('ip:a', rule).allowed).toBe(true);
    expect(limiter.check('ip:a', rule).allowed).toBe(true);

    const blocked = limiter.check('ip:a', rule);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it('isolates keys and slides the window', () => {
    let now = 10_000;
    const limiter = new MemoryRateLimiter(() => now);
    const rule = { limit: 1, windowMs: 5_000 };

    expect(limiter.check('a', rule).allowed).toBe(true);
    expect(limiter.check('b', rule).allowed).toBe(true);
    expect(limiter.check('a', rule).allowed).toBe(false);

    now = 15_001;
    expect(limiter.check('a', rule).allowed).toBe(true);
  });

  it('reset clears counters', () => {
    const limiter = new MemoryRateLimiter(() => 1);
    const rule = { limit: 1, windowMs: 1_000 };
    expect(limiter.check('x', rule).allowed).toBe(true);
    expect(limiter.check('x', rule).allowed).toBe(false);
    limiter.reset();
    expect(limiter.check('x', rule).allowed).toBe(true);
  });

  it('GCs idle keys after the idle TTL', () => {
    let now = 1_000;
    const limiter = new MemoryRateLimiter(() => now, 1_000);
    const rule = { limit: 5, windowMs: 500 };

    expect(limiter.check('stale', rule).allowed).toBe(true);
    expect(limiter.size()).toBe(1);

    now = 3_000;
    // 63 more checks → the 64th overall triggers GC and drops idle `stale`.
    for (let i = 0; i < 63; i++) {
      expect(limiter.check(`noise-${i}`, rule).allowed).toBe(true);
    }
    expect(limiter.check('fresh', rule).allowed).toBe(true);
    // 63 noise keys + fresh; stale was pruned.
    expect(limiter.size()).toBe(64);
  });
});
