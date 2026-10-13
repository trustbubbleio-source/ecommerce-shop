import type { RateLimitRule } from './limiter.js';

/**
 * Shared presets for public / abuse-prone API routes.
 * Tune here once; every consumer imports the same numbers.
 */
export const RATE_LIMIT_PRESETS = {
  /** Contact form. */
  contact: { limit: 5, windowMs: 15 * 60_000 } satisfies RateLimitRule,
  /** Newsletter signup. */
  newsletter: { limit: 5, windowMs: 15 * 60_000 } satisfies RateLimitRule,
  /** Card restoration photo assessment (heavier uploads). */
  restoration: { limit: 5, windowMs: 15 * 60_000 } satisfies RateLimitRule,
  /** Authenticated sell submissions. */
  sell: { limit: 10, windowMs: 60 * 60_000 } satisfies RateLimitRule,
  /** Login / register / Google (brute-force cushion). */
  auth: { limit: 20, windowMs: 15 * 60_000 } satisfies RateLimitRule,
  /** Password reset emails (stricter). */
  authSensitive: { limit: 5, windowMs: 15 * 60_000 } satisfies RateLimitRule,
} as const;

export type RateLimitPreset = keyof typeof RATE_LIMIT_PRESETS;
