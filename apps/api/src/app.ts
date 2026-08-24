import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import type { AppDeps, AppEnv } from './context.js';
import { loadEnv } from './env.js';
import { EmailService } from './lib/email.js';
import { PaymentService } from './lib/payments.js';
import { StorageService } from './lib/storage.js';
import { authOptional } from './middleware/auth.js';
import { createMemoryRepositories } from './repositories/factory.js';
import { authRoutes } from './routes/auth.js';
import { adminRoutes } from './routes/admin.js';
import { checkoutRoutes } from './routes/checkout.js';
import { contactRoutes } from './routes/contact.js';
import { orderRoutes } from './routes/orders.js';
import { productRoutes } from './routes/products.js';
import { webhookRoutes } from './routes/webhooks.js';

export interface CreatedApp {
  app: Hono<AppEnv>;
  deps: AppDeps;
}

/** Build a fully-wired API instance. Dependencies are injectable for testing. */
export function createApp(overrides: Partial<AppDeps> = {}): CreatedApp {
  const env = overrides.env ?? loadEnv();
  const memory = createMemoryRepositories();
  const deps: AppDeps = {
    env,
    users: overrides.users ?? memory.users,
    orders: overrides.orders ?? memory.orders,
    products: overrides.products ?? memory.products,
    payments: overrides.payments ?? new PaymentService(env),
    storage: overrides.storage ?? new StorageService(env.storage),
    email: overrides.email ?? new EmailService(env),
  };

  const app = new Hono<AppEnv>();

  if (process.env.NODE_ENV !== 'test') {
    app.use('*', logger());
  }
  app.use('*', cors({ origin: env.webOrigins, credentials: true }));
  app.use('*', authOptional(env));

  const api = new Hono<AppEnv>();
  api.get('/health', (c) =>
    c.json({
      status: 'ok',
      stripe: deps.payments.enabled ? 'live' : 'mock',
      database: env.databaseEnabled ? 'postgres' : 'memory',
      storage: env.storage.enabled ? 's3' : 'none',
      email: deps.email.enabled ? 'resend' : 'mock',
      google: env.google.enabled ? 'enabled' : 'disabled',
    }),
  );
  api.route('/products', productRoutes(deps));
  api.route('/auth', authRoutes(deps));
  api.route('/admin', adminRoutes(deps));
  api.route('/checkout', checkoutRoutes(deps));
  api.route('/orders', orderRoutes(deps));
  api.route('/contact', contactRoutes(deps));
  api.route('/webhooks', webhookRoutes(deps));

  app.route('/api', api);

  app.notFound((c) => c.json({ error: 'Not found' }, 404));
  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return err.getResponse();
    }
    console.error('[api] unhandled error', err);
    return c.json({ error: 'Internal server error' }, 500);
  });

  return { app, deps };
}
