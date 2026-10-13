import type { MemoryRateLimiter } from '@akknerds/rate-limit';
import type { Env } from './env.js';
import type { EmailService } from './lib/email.js';
import type { TokenPayload } from './lib/jwt.js';
import type { PaymentService } from './lib/payments.js';
import type { StorageService } from './lib/storage.js';
import type {
  FavoriteRepository,
  OrderRepository,
  ProductRepository,
  ProductReviewRepository,
  UserRepository,
  NewsletterRepository,
  RestorationSubmissionRepository,
  WantListRepository,
} from './repositories/interfaces.js';

/** Dependencies wired into each app instance (injectable for tests). */
export interface AppDeps {
  env: Env;
  users: UserRepository;
  orders: OrderRepository;
  products: ProductRepository;
  favorites: FavoriteRepository;
  reviews: ProductReviewRepository;
  wantList: WantListRepository;
  newsletter: NewsletterRepository;
  restorationSubmissions: RestorationSubmissionRepository;
  payments: PaymentService;
  storage: StorageService;
  email: EmailService;
  rateLimiter: MemoryRateLimiter;
}

/** Hono context variables available to handlers and middleware. */
export interface AppVariables {
  user?: TokenPayload;
}

export type AppEnv = { Variables: AppVariables };
