import {
  RESTORATION_MAX_IMAGE_BYTES,
  RESTORATION_MAX_TOTAL_IMAGE_BYTES,
  RESTORATION_PACKAGE_LABELS,
  RESTORATION_PHOTO_SLOTS,
  detectSellImageMime,
  restorationSubmissionInputSchema,
  sellImageExtension,
  updateRestorationStatusSchema,
  type RestorationPhoto,
  type RestorationPhotoSlot,
  type RestorationSubmissionAdmin,
} from '@akknerds/shared';
import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import type { AppDeps, AppEnv } from '../context.js';
import type { SendEmailAttachment } from '../lib/email.js';
import { rejectIfContentLengthTooLarge, validate } from '../lib/http.js';
import { requireAdmin } from '../middleware/admin.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';

const RESTORATION_MAX_REQUEST_BYTES = RESTORATION_MAX_TOTAL_IMAGE_BYTES + 1024 * 1024;

function resolvePhotoUrl(deps: AppDeps, key: string): string {
  if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('data:')) {
    return key;
  }
  return deps.storage.resolvePublicUrl(key) ?? key;
}

function toAdminItem(
  deps: AppDeps,
  item: Awaited<ReturnType<AppDeps['restorationSubmissions']['listAll']>>[number],
): RestorationSubmissionAdmin {
  return {
    ...item,
    photos: item.photos.map((photo) => ({
      ...photo,
      url: resolvePhotoUrl(deps, photo.key),
    })),
  };
}

export function restorationRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.post('/', rateLimit(deps.rateLimiter, 'restoration'), async (c) => {
    const contentType = c.req.header('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return c.json({ error: 'Restoration submissions must be multipart/form-data' }, 400);
    }

    const tooLarge = rejectIfContentLengthTooLarge(
      c,
      RESTORATION_MAX_REQUEST_BYTES,
      'Upload too large (max 16 MB).',
    );
    if (tooLarge) return tooLarge;

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

    const parsed = restorationSubmissionInputSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const photos: RestorationPhoto[] = [];
    const attachments: SendEmailAttachment[] = [];
    let totalBytes = 0;
    let sawFront = false;

    for (const slot of RESTORATION_PHOTO_SLOTS) {
      const raw = (body as Record<string, unknown>)[`photo_${slot}`];
      if (!raw) continue;
      if (!(raw instanceof File)) {
        return c.json({ error: `photo_${slot} must be an image file` }, 400);
      }
      if (raw.size === 0) {
        return c.json({ error: `${slot} photo is empty` }, 400);
      }
      if (raw.size > RESTORATION_MAX_IMAGE_BYTES) {
        return c.json({ error: `Each photo must be under 5 MB (${slot})` }, 400);
      }

      const buffer = Buffer.from(await raw.arrayBuffer());
      if (buffer.byteLength === 0) {
        return c.json({ error: `${slot} photo is empty` }, 400);
      }
      if (buffer.byteLength > RESTORATION_MAX_IMAGE_BYTES) {
        return c.json({ error: `Each photo must be under 5 MB (${slot})` }, 400);
      }

      const detected = detectSellImageMime(buffer);
      if (!detected) {
        return c.json(
          { error: `Unsupported image for ${slot}. Only JPG, PNG, or WebP are allowed.` },
          400,
        );
      }

      totalBytes += buffer.byteLength;
      if (totalBytes > RESTORATION_MAX_TOTAL_IMAGE_BYTES) {
        return c.json({ error: 'Total photo size is too large (max 15 MB).' }, 400);
      }

      const ext = sellImageExtension(detected);
      const contentTypeMime = detected;
      let key: string;

      if (deps.storage.enabled) {
        key = await deps.storage.uploadRestorationImage(
          { name: `${slot}.${ext}`, type: contentTypeMime, buffer },
          `restorations/${nanoid(12)}/${slot}.${ext}`,
        );
      } else {
        key = `data:${contentTypeMime};base64,${buffer.toString('base64')}`;
      }

      photos.push({ slot: slot as RestorationPhotoSlot, key });
      attachments.push({
        filename: `${slot}.${ext}`,
        content: buffer,
        contentType: contentTypeMime,
      });
      if (slot === 'front') sawFront = true;
    }

    if (!sawFront) {
      return c.json({ error: 'A front photo is required' }, 400);
    }

    const submission = await deps.restorationSubmissions.create({
      email: parsed.data.email,
      notes: parsed.data.notes ?? '',
      packageInterest: parsed.data.packageInterest,
      photos,
    });

    try {
      await deps.email.sendRestorationSubmission({
        email: submission.email,
        notes: submission.notes,
        packageLabel: RESTORATION_PACKAGE_LABELS[submission.packageInterest],
        photoSlots: submission.photos.map((photo) => photo.slot),
        submissionId: submission.id,
        attachments,
      });
    } catch (error) {
      console.error('[email] restoration submission notify failed', error);
      // Submission is already stored; do not fail the customer request.
    }

    return c.json({
      ok: true,
      message: "Thanks! We'll review your photos and email you with an assessment.",
      id: submission.id,
    });
  });

  return app;
}

export function adminRestorationRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.get('/', requireAuth(), requireAdmin(deps), async (c) => {
    const items = await deps.restorationSubmissions.listAll();
    return c.json({ items: items.map((item) => toAdminItem(deps, item)) });
  });

  app.patch(
    '/:id',
    requireAuth(),
    requireAdmin(deps),
    validate('json', updateRestorationStatusSchema),
    async (c) => {
      const body = c.req.valid('json');
      const item = await deps.restorationSubmissions.updateStatus(c.req.param('id'), {
        status: body.status,
        adminNote: body.adminNote,
      });
      if (!item) return c.json({ error: 'Submission not found' }, 404);
      return c.json({ item: toAdminItem(deps, item) });
    },
  );

  return app;
}
