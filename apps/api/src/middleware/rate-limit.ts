import {
  RATE_LIMIT_PRESETS,
  type MemoryRateLimiter,
  type RateLimitPreset,
  type RateLimitRule,
} from '@akknerds/rate-limit';
import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../context.js';

/** Best-effort client IP (proxy-aware). */
export function clientIp(headers: Headers, fallback = 'unknown'): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first.slice(0, 128);
  }
  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp) return realIp.slice(0, 128);
  const cf = headers.get('cf-connecting-ip')?.trim();
  if (cf) return cf.slice(0, 128);
  return fallback;
}

/**
 * Sliding-window rate limit for a named bucket (usually a route family).
 * Keys are `bucket:ip` so limits stay per-client and per-feature.
 */
export function rateLimit(
  limiter: MemoryRateLimiter,
  presetOrRule: RateLimitPreset | RateLimitRule,
  bucket?: string,
): MiddlewareHandler<AppEnv> {
  const rule =
    typeof presetOrRule === 'string' ? RATE_LIMIT_PRESETS[presetOrRule] : presetOrRule;
  const name = bucket ?? (typeof presetOrRule === 'string' ? presetOrRule : 'custom');

  return async (c, next) => {
    const ip = clientIp(c.req.raw.headers);
    const result = limiter.check(`${name}:${ip}`, rule);

    c.header('X-RateLimit-Limit', String(result.limit));
    c.header('X-RateLimit-Remaining', String(result.remaining));

    if (!result.allowed) {
      c.header('Retry-After', String(result.retryAfterSec));
      return c.json(
        { error: 'Too many requests. Please try again in a bit.' },
        429,
      );
    }

    await next();
  };
}
