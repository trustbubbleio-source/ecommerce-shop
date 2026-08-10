import { serve } from '@hono/node-server';
import { fetchUngradedPriceFromPriceCharting, PriceFetchError } from '@akknerds/price-fetcher';
import { fetchCardImageInputSchema } from '@akknerds/shared';
import { zValidator } from '@hono/zod-validator';
import { config } from 'dotenv';
import { Hono } from 'hono';

config({ path: '../../.env' });

const port = Number.parseInt(process.env.PRICE_FETCHER_PORT ?? '4002', 10);
const secret = process.env.PRICE_FETCHER_SECRET ?? '';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok', service: 'price-fetcher' }));

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
      const result = await fetchUngradedPriceFromPriceCharting({
        set: input.set,
        cardNumber: input.cardNumber,
        language: input.language,
      });
      return c.json(result);
    } catch (error) {
      if (error instanceof PriceFetchError) {
        const status = error.code === 'not_found' ? 404 : error.code === 'unsupported' ? 422 : 502;
        return c.json({ error: error.message }, status);
      }
      return c.json({ error: 'Fetch failed' }, 502);
    }
  },
);

serve({ fetch: app.fetch, port }, () => {
  console.log(`[price-fetcher] listening on http://localhost:${port}`);
});
