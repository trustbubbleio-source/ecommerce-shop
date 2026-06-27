import type { Env } from './env.js';
import type { TokenPayload } from './lib/jwt.js';
import type { PaymentService } from './lib/payments.js';
import type { OrderRepository } from './repositories/orders.js';
import type { ProductRepository } from './repositories/products.js';
import type { UserRepository } from './repositories/users.js';

/** Dependencies wired into each app instance (injectable for tests). */
export interface AppDeps {
  env: Env;
  users: UserRepository;
  orders: OrderRepository;
  products: ProductRepository;
  payments: PaymentService;
}

/** Hono context variables available to handlers and middleware. */
export interface AppVariables {
  user?: TokenPayload;
}

export type AppEnv = { Variables: AppVariables };
