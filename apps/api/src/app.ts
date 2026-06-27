import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import type { AppDeps, AppEnv } from './context.js';
import { loadEnv } from './env.js';
import { PaymentService } from './lib/payments.js';
import { authOptional } from './middleware/auth.js';
import { OrderRepository } from './repositories/orders.js';
import { ProductRepository } from './repositories/products.js';
import { UserRepository } from './repositories/users.js';
import { authRoutes } from './routes/auth.js';
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
  const deps: AppDeps = {
    env,
    users: overrides.users ?? new UserRepository(),
    orders: overrides.orders ?? new OrderRepository(),
    products: overrides.products ?? new ProductRepository(),
    payments: overrides.payments ?? new PaymentService(env),
  };

  const app = new Hono<AppEnv>();

  if (process.env.NODE_ENV !== 'test') {
    app.use('*', logger());
  }
  app.use('*', cors({ origin: env.webOrigins, credentials: true }));
  app.use('*', authOptional(env));

  const api = new Hono<AppEnv>();
  api.get('/health', (c) =>
    c.json({ status: 'ok', stripe: deps.payments.enabled ? 'live' : 'mock' }),
  );
  api.route('/products', productRoutes(deps));
  api.route('/auth', authRoutes(deps));
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
