import { Hono } from 'hono';
import { z } from 'zod';
import type { AppDeps, AppEnv } from '../context.js';
import { validate } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';

const markReadSchema = z.object({
  ids: z.array(z.string().min(1)).max(50).optional(),
});

export function notificationRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.get('/', requireAuth(), async (c) => {
    const user = c.get('user')!;
    const [notifications, unreadCount] = await Promise.all([
      deps.notifications.listByUser(user.sub),
      deps.notifications.unreadCount(user.sub),
    ]);
    return c.json({ notifications, unreadCount });
  });

  app.post('/read', requireAuth(), validate('json', markReadSchema), async (c) => {
    const user = c.get('user')!;
    const { ids } = c.req.valid('json');
    const marked = await deps.notifications.markRead(user.sub, ids);
    const unreadCount = await deps.notifications.unreadCount(user.sub);
    return c.json({ marked, unreadCount });
  });

  return app;
}
