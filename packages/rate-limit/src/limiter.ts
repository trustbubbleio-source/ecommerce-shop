export interface RateLimitRule {
  /** Max allowed hits inside the window. */
  limit: number;
  /** Sliding window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the oldest hit leaves the window (0 when allowed). */
  retryAfterSec: number;
}

/**
 * In-memory sliding-window rate limiter.
 * Fine for a single API process; swap the store later for Redis if you scale out.
 */
export class MemoryRateLimiter {
  private readonly hits = new Map<string, number[]>();
  private checks = 0;
  /** Drop keys with no hits newer than this (covers all current presets). */
  private readonly idleTtlMs: number;

  constructor(
    private readonly now: () => number = () => Date.now(),
    idleTtlMs = 60 * 60 * 1000,
  ) {
    this.idleTtlMs = idleTtlMs;
  }

  check(key: string, rule: RateLimitRule): RateLimitResult {
    const now = this.now();
    this.maybeGc(now);

    const windowStart = now - rule.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((ts) => ts > windowStart);

    if (recent.length >= rule.limit) {
      const oldest = recent[0] ?? now;
      const retryAfterMs = Math.max(0, oldest + rule.windowMs - now);
      this.hits.set(key, recent);
      return {
        allowed: false,
        limit: rule.limit,
        remaining: 0,
        retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      };
    }

    recent.push(now);
    this.hits.set(key, recent);
    return {
      allowed: true,
      limit: rule.limit,
      remaining: Math.max(0, rule.limit - recent.length),
      retryAfterSec: 0,
    };
  }

  /** Drop all counters (tests / process recycle). */
  reset(): void {
    this.hits.clear();
    this.checks = 0;
  }

  /** Test helper — current key count after GC opportunities. */
  size(): number {
    return this.hits.size;
  }

  private maybeGc(now: number): void {
    this.checks += 1;
    if (this.checks % 64 !== 0) return;
    const cutoff = now - this.idleTtlMs;
    for (const [key, timestamps] of this.hits) {
      const recent = timestamps.filter((ts) => ts > cutoff);
      if (recent.length === 0) this.hits.delete(key);
      else this.hits.set(key, recent);
    }
  }
}
