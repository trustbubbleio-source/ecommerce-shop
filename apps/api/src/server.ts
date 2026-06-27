import { serve } from '@hono/node-server';
import { config } from 'dotenv';
import { createApp } from './app.js';
import { loadEnv } from './env.js';

// Load env from a repo-root .env or a local apps/api/.env if present (optional).
config({ path: ['../../.env', '.env'] });

const env = loadEnv();
const { app } = createApp({ env });

serve({ fetch: app.fetch, port: env.port }, (info) => {
  const mode = env.stripeEnabled ? 'live Stripe' : 'mock payments';
  // eslint-disable-next-line no-console
  console.log(`▲ akkNERDS API ready on http://localhost:${info.port} (${mode})`);
});
