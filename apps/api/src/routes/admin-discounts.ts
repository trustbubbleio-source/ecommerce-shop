import {
  DISCOUNT_CODES,
  createDiscountCodeInputSchema,
  findDiscountCode,
  normalizeDiscountCode,
} from '@akknerds/shared';
import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import { validate } from '../lib/http.js';
import { requireAdmin } from '../middleware/admin.js';
import { requireAuth } from '../middleware/auth.js';

export function adminDiscountRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.get('/users', requireAuth(), requireAdmin(deps), async (c) => {
    const q = c.req.query('q')?.trim() ?? '';
    const users = q.length >= 2 ? await deps.users.search(q, 20) : [];
    return c.json({ users });
  });

  app.get('/', requireAuth(), requireAdmin(deps), async (c) => {
    const custom = await deps.discounts.list();
    return c.json({
      builtin: DISCOUNT_CODES,
      custom,
    });
  });

  app.post(
    '/',
    requireAuth(),
    requireAdmin(deps),
    validate('json', createDiscountCodeInputSchema),
    async (c) => {
      const input = c.req.valid('json');
      const code = normalizeDiscountCode(input.code);

      if (findDiscountCode(code)) {
        return c.json({ error: 'That code is reserved by a built-in promo.' }, 409);
      }
      const existing = await deps.discounts.findByCode(code);
      if (existing) {
        return c.json({ error: 'That code already exists.' }, 409);
      }

      let allowedEmail = input.allowedEmail;
      let allowedUserId = input.allowedUserId;

      if (allowedUserId) {
        const user = await deps.users.findById(allowedUserId);
        if (!user) return c.json({ error: 'User not found.' }, 404);
        allowedEmail = allowedEmail ?? user.email;
        allowedUserId = user.id;
      } else if (allowedEmail) {
        const user = await deps.users.findByEmail(allowedEmail);
        if (user) allowedUserId = user.id;
      }

      const discount = await deps.discounts.create({
        code,
        label: input.label,
        kind: input.kind,
        value: input.value,
        allowedEmail,
        allowedUserId,
      });

      let assigned = false;
      if (input.assignToUser && allowedUserId) {
        await deps.users.updateProfile(allowedUserId, { discountCode: discount.code });
        assigned = true;
      }

      return c.json({ discount, assigned }, 201);
    },
  );

  app.patch('/:id/active', requireAuth(), requireAdmin(deps), async (c) => {
    const active = c.req.query('active') !== 'false';
    const discount = await deps.discounts.setActive(c.req.param('id'), active);
    if (!discount) return c.json({ error: 'Discount not found' }, 404);
    return c.json({ discount });
  });

  app.delete('/:id', requireAuth(), requireAdmin(deps), async (c) => {
    const ok = await deps.discounts.delete(c.req.param('id'));
    if (!ok) return c.json({ error: 'Discount not found' }, 404);
    return c.json({ ok: true });
  });

  return app;
}
