import { serve } from '@hono/node-server';
import { disconnectDb } from '@akknerds/db';
import { config } from 'dotenv';
import { createApp } from './app.js';
import { assertProductionEnv, loadEnv } from './env.js';
import { reapPendingOrders } from './lib/pending-orders.js';
import { createRepositories } from './repositories/factory.js';

// Load env from a repo-root .env or a local apps/api/.env if present (optional).
config({ path: ['../../.env', '.env'] });

const env = loadEnv();
assertProductionEnv(env);
const repos = createRepositories(env);
const { app, deps } = createApp({ env, ...repos });

const shutdown = async () => {
  if (pendingTimer) clearInterval(pendingTimer);
  if (env.databaseEnabled) {
    await disconnectDb();
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

let pendingTimer: ReturnType<typeof setInterval> | undefined;
if (process.env.NODE_ENV !== 'test') {
  const intervalMs = 5 * 60 * 1000;
  const runReaper = () => {
    const olderThan = new Date(Date.now() - env.pendingOrderTtlMinutes * 60_000);
    void reapPendingOrders(deps, olderThan).then(
      (result) => {
        if (result.scanned > 0) {
          // eslint-disable-next-line no-console
          console.log(
            `[pending-orders] scanned=${result.scanned} paid=${result.paid} cancelled=${result.cancelled}`,
          );
        }
      },
      (error) => console.error('[pending-orders] reaper failed', error),
    );
  };
  pendingTimer = setInterval(runReaper, intervalMs);
  // Unref so the timer does not keep the process alive alone in some hosts.
  pendingTimer.unref?.();
}

serve({ fetch: app.fetch, port: env.port }, (info) => {
  const mode = env.paypalEnabled ? `PayPal (${env.paypalMode})` : 'mock payments';
  const storage = env.databaseEnabled ? 'Postgres' : 'in-memory';
  // eslint-disable-next-line no-console
  console.log(`▲ One More Rip API ready on http://localhost:${info.port} (${mode}, ${storage})`);
});
