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

  constructor(private readonly now: () => number = () => Date.now()) {}

  check(key: string, rule: RateLimitRule): RateLimitResult {
    const now = this.now();
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
  }
}
