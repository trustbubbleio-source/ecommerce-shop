import { serve } from '@hono/node-server';
import { disconnectDb } from '@akknerds/db';
import { config } from 'dotenv';
import { createApp } from './app.js';
import { loadEnv } from './env.js';
import { createRepositories } from './repositories/factory.js';

// Load env from a repo-root .env or a local apps/api/.env if present (optional).
config({ path: ['../../.env', '.env'] });

const env = loadEnv();
const repos = createRepositories(env);
const { app } = createApp({ env, ...repos });

const shutdown = async () => {
  if (env.databaseEnabled) {
    await disconnectDb();
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

serve({ fetch: app.fetch, port: env.port }, (info) => {
  const mode = env.stripeEnabled ? 'live Stripe' : 'mock payments';
  const storage = env.databaseEnabled ? 'Postgres' : 'in-memory';
  // eslint-disable-next-line no-console
  console.log(`▲ One More Rip API ready on http://localhost:${info.port} (${mode}, ${storage})`);
});
