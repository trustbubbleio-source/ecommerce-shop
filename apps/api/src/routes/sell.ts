import {
  SELL_MAX_IMAGE_BYTES,
  SELL_MAX_TOTAL_IMAGE_BYTES,
  detectSellImageMime,
  sellImageExtension,
  sellRequestInputSchema,
} from '@akknerds/shared';
import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import type { SendEmailAttachment } from '../lib/email.js';
import { requireAuth } from '../middleware/auth.js';

export function sellRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.post('/', requireAuth(), async (c) => {
    const user = c.get('user')!;
    const stored = await deps.users.findById(user.sub);
    if (!stored) return c.json({ error: 'Account not found' }, 401);

    const contentType = c.req.header('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return c.json({ error: 'Sell requests must be multipart/form-data' }, 400);
    }

    let body: unknown;
    try {
      body = await c.req.parseBody({ all: true });
    } catch {
      return c.json({ error: 'Could not parse upload' }, 400);
    }

    const rawPayload = (body as Record<string, unknown>).payload;
    if (typeof rawPayload !== 'string') {
      return c.json({ error: 'Missing payload' }, 400);
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawPayload);
    } catch {
      return c.json({ error: 'Invalid payload JSON' }, 400);
    }

    const parsed = sellRequestInputSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const attachments: SendEmailAttachment[] = [];
    let totalBytes = 0;
    const itemsWithPhotos = parsed.data.items.map((item, index) => {
      return { ...item, hasPhoto: false, index };
    });

    for (let index = 0; index < parsed.data.items.length; index++) {
      const raw = (body as Record<string, unknown>)[`photo_${index}`];
      if (!raw) continue;
      if (!(raw instanceof File)) {
        return c.json({ error: `photo_${index} must be an image file` }, 400);
      }

      const buffer = Buffer.from(await raw.arrayBuffer());
      if (buffer.byteLength === 0) {
        return c.json({ error: `photo_${index} is empty` }, 400);
      }
      if (buffer.byteLength > SELL_MAX_IMAGE_BYTES) {
        return c.json({ error: `Each photo must be under 5 MB (card ${index + 1})` }, 400);
      }

      const detected = detectSellImageMime(buffer);
      if (!detected) {
        return c.json(
          {
            error: `Unsupported image for card ${index + 1}. Only JPG, PNG, or WebP are allowed.`,
          },
          400,
        );
      }

      totalBytes += buffer.byteLength;
      if (totalBytes > SELL_MAX_TOTAL_IMAGE_BYTES) {
        return c.json({ error: 'Total photo size is too large (max 25 MB).' }, 400);
      }

      const ext = sellImageExtension(detected);
      const safeTitle = parsed.data.items[index]!.title
        .replace(/[^\w\-]+/g, '_')
        .slice(0, 40)
        .replace(/^_+|_+$/g, '') || `card_${index + 1}`;

      attachments.push({
        filename: `${index + 1}_${safeTitle}.${ext}`,
        content: buffer,
        contentType: detected,
      });
      itemsWithPhotos[index]!.hasPhoto = true;
    }

    try {
      await deps.email.sendSellRequest({
        name: stored.name,
        email: stored.email,
        userId: stored.id,
        notes: parsed.data.notes ?? '',
        items: itemsWithPhotos.map(({ title, notes, condition, hasPhoto }) => ({
          title,
          notes: notes ?? '',
          condition: condition ?? '',
          hasPhoto,
        })),
        attachments,
      });
    } catch (error) {
      console.error('[email] sell request failed', error);
      return c.json({ error: 'Could not send your sell request. Please try again later.' }, 502);
    }

    return c.json({
      ok: true,
      message: "Thanks — we'll review your cards and get back to you.",
    });
  });

  return app;
}
