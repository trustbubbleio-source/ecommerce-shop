import { serve } from '@hono/node-server';
import { fetchCardImageInputSchema } from '@akknerds/shared';
import { CardFetchError, fetchCardImageFromPokellector } from '@akknerds/card-fetcher';
import { zValidator } from '@hono/zod-validator';
import { config } from 'dotenv';
import { Hono } from 'hono';

config({ path: '../../.env' });

const port = Number.parseInt(process.env.CARD_FETCHER_PORT ?? '4001', 10);
const secret = process.env.CARD_FETCHER_SECRET ?? '';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok', service: 'card-fetcher' }));

app.post(
  '/fetch',
  zValidator('json', fetchCardImageInputSchema),
  async (c) => {
    if (secret) {
      const auth = c.req.header('authorization');
      if (auth !== `Bearer ${secret}`) {
        return c.json({ error: 'Unauthorized' }, 401);
      }
    }

    const input = c.req.valid('json');
    try {
      const result = await fetchCardImageFromPokellector(input);
      return c.json({
        cardName: result.cardName,
        cardNumber: result.cardNumber,
        sourceUrl: result.sourceUrl,
        contentType: result.contentType,
        imageBase64: result.buffer.toString('base64'),
      });
    } catch (error) {
      if (error instanceof CardFetchError) {
        const status = error.code === 'not_found' ? 404 : error.code === 'unsupported' ? 422 : 502;
        return c.json({ error: error.message }, status);
      }
      return c.json({ error: 'Fetch failed' }, 502);
    }
  },
);

serve({ fetch: app.fetch, port }, () => {
  console.log(`[card-fetcher] listening on http://localhost:${port}`);
});
