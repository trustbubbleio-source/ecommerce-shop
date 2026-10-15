import { zValidator } from '@hono/zod-validator';
import type { Context, ValidationTargets } from 'hono';
import type { ZodSchema } from 'zod';

/**
 * zod validator that returns errors in our `ApiError` shape
 * ({ error, details }) instead of the default zod-validator response.
 */
export function validate<T extends ZodSchema, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T,
) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', details: result.error.flatten() }, 400);
    }
    return undefined;
  });
}

/**
 * Reject oversized uploads before buffering the body when Content-Length is present.
 * Returns a Response to short-circuit, or null to continue.
 */
export function rejectIfContentLengthTooLarge(
  c: Context,
  maxBytes: number,
  message = 'Upload too large',
): Response | null {
  const raw = c.req.header('content-length');
  if (!raw) return null;
  const length = Number(raw);
  if (!Number.isFinite(length) || length < 0) return null;
  if (length > maxBytes) {
    return c.json({ error: message }, 413);
  }
  return null;
}
