import {
  createWantListItemSchema,
  updateWantListStatusSchema,
  wantListPresetLabel,
} from '@akknerds/shared';
import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import { validate } from '../lib/http.js';
import { requireAdmin } from '../middleware/admin.js';
import { requireAuth } from '../middleware/auth.js';

export function wantListRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.get('/', requireAuth(), async (c) => {
    const user = c.get('user')!;
    const items = await deps.wantList.listByUser(user.sub);
    return c.json({ items });
  });

  app.post('/', requireAuth(), validate('json', createWantListItemSchema), async (c) => {
    const user = c.get('user')!;
    const stored = await deps.users.findById(user.sub);
    if (!stored) return c.json({ error: 'Account not found' }, 401);

    const body = c.req.valid('json');
    const item = await deps.wantList.create({
      userId: user.sub,
      preset: body.preset,
      title: body.title,
      notes: body.notes ?? '',
    });

    try {
      await deps.email.sendWantListAlert({
        name: stored.name,
        email: stored.email,
        userId: stored.id,
        presetLabel: wantListPresetLabel(body.preset),
        title: body.title,
        notes: body.notes ?? '',
      });
    } catch (error) {
      console.error('[email] want list alert failed', error);
    }

    return c.json({ item }, 201);
  });

  app.delete('/:id', requireAuth(), async (c) => {
    const user = c.get('user')!;
    const ok = await deps.wantList.remove(user.sub, c.req.param('id'));
    if (!ok) return c.json({ error: 'Want list item not found' }, 404);
    return c.json({ ok: true });
  });

  return app;
}

export function adminWantListRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.get('/', requireAuth(), requireAdmin(deps), async (c) => {
    const items = await deps.wantList.listAll();
    return c.json({ items });
  });

  app.patch('/:id', requireAuth(), requireAdmin(deps), validate('json', updateWantListStatusSchema), async (c) => {
    const body = c.req.valid('json');
    const item = await deps.wantList.updateStatus(c.req.param('id'), {
      status: body.status,
      adminNote: body.adminNote,
    });
    if (!item) return c.json({ error: 'Want list item not found' }, 404);
    return c.json({ item });
  });

  return app;
}
