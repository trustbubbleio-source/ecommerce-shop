import type {
  Address,
  AppNotification,
  CatalogStats,
  CreateProductInput,
  FulfillmentStep,
  NotificationType,
  Order,
  OrderLine,
  OrderStatus,
  Product,
  ProductFilter,
  ProductReview,
  SortKey,
  UpdateProfileInput,
  UserRole,
  RestorationPackageId,
  RestorationPhoto,
  RestorationSubmission,
  RestorationSubmissionStatus,
  WantListAdminItem,
  WantListItem,
} from '@akknerds/shared';
import type { StoredUser } from './users.js';

export interface CreateOrderInput {
  email: string;
  userId?: string;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  shippingAddress?: Address;
  /** Defaults to pending / online for web checkout. */
  status?: import('@akknerds/shared').OrderStatus;
  channel?: import('@akknerds/shared').OrderChannel;
  fulfillmentStep?: import('@akknerds/shared').FulfillmentStep;
}

export interface UserRepository {
  findByEmail(email: string): Promise<StoredUser | undefined>;
  findById(id: string): Promise<StoredUser | undefined>;
  findByGoogleSub(googleSub: string): Promise<StoredUser | undefined>;
  create(input: {
    email: string;
    name: string;
    passwordHash?: string | null;
    googleSub?: string | null;
    role?: UserRole;
    /** ISO timestamp; omit/null = pending email verification. */
    emailVerifiedAt?: string | null;
  }): Promise<StoredUser>;
  updatePassword(userId: string, passwordHash: string): Promise<StoredUser | undefined>;
  updateProfile(userId: string, input: UpdateProfileInput): Promise<StoredUser | undefined>;
  linkGoogle(userId: string, googleSub: string): Promise<StoredUser | undefined>;
  markEmailVerified(userId: string): Promise<StoredUser | undefined>;
}

export interface OrderFulfillmentPatch {
  fulfillmentStep: FulfillmentStep;
  carrierName?: string;
  trackingUrl?: string | null;
}

export interface OrderRepository {
  create(input: CreateOrderInput): Promise<Order>;
  get(id: string): Promise<Order | undefined>;
  getByStripeSession(sessionId: string): Promise<Order | undefined>;
  listAll(): Promise<Order[]>;
  attachSession(orderId: string, sessionId: string): Promise<void>;
  setInvoiceUrl(orderId: string, invoiceUrl: string): Promise<void>;
  updateFulfillment(orderId: string, input: OrderFulfillmentPatch): Promise<Order | undefined>;
  /** Marks the order cancelled and stores the customer-facing reason. */
  cancel(orderId: string, reason: string): Promise<Order | undefined>;
  markStatusBySession(sessionId: string, status: OrderStatus): Promise<Order | undefined>;
  /**
   * Atomically pending → paid by Stripe session.
   * Returns the order only when this call performed the transition (idempotent for emails).
   */
  markPaidBySession(sessionId: string): Promise<Order | undefined>;
  setStatus(orderId: string, status: OrderStatus): Promise<Order | undefined>;
  listByUser(userId: string): Promise<Order[]>;
  /** True if the user has a paid/fulfilled order containing the product. */
  hasPurchasedProduct(userId: string, productId: string): Promise<boolean>;
}

export type AdminProductSortKey = 'name' | 'category' | 'price' | 'stock' | 'status';

export interface ListOptions {
  filter?: ProductFilter;
  sort?: SortKey;
  featured?: boolean;
  isNew?: boolean;
  limit?: number;
  offset?: number;
  adminSort?: { key: AdminProductSortKey; dir: 'asc' | 'desc' };
}

export interface ProductPage {
  products: Product[];
  total: number;
}

export interface CatalogMeta {
  categories: { value: string; count: number }[];
  series: readonly string[];
  sets: readonly string[];
  priceRange: { min: number; max: number };
}

export interface StockAdjustment {
  productId: string;
  quantity: number;
}

export type ReserveStockResult =
  | { ok: true }
  | { ok: false; productId: string };

export interface ProductRepository {
  list(options?: ListOptions): Promise<Product[]>;
  listPage(options?: ListOptions): Promise<ProductPage>;
  getByIdOrSlug(idOrSlug: string): Promise<Product | undefined>;
  meta(): Promise<CatalogMeta>;
  catalogStats(): Promise<CatalogStats>;
  create(input: CreateProductInput): Promise<Product>;
  update(id: string, input: CreateProductInput): Promise<Product | undefined>;
  /** Permanently remove a product (cascades favorites/reviews). */
  delete(id: string): Promise<boolean>;
  /** Sync catalogue aggregate stars after a new review. */
  setRatingStats(
    productId: string,
    stats: { rating: number; reviewCount: number },
  ): Promise<Product | undefined>;
  /**
   * Atomically reserve units for checkout (decrement). Fails if any line
   * would go below zero — no partial reservation is kept.
   */
  reserveStock(lines: StockAdjustment[]): Promise<ReserveStockResult>;
  /** Put reserved units back (increment) after cancel / abandon / failed checkout. */
  releaseStock(lines: StockAdjustment[]): Promise<void>;
}

export interface FavoriteRepository {
  listProductIds(userId: string): Promise<string[]>;
  listProducts(userId: string): Promise<Product[]>;
  has(userId: string, productId: string): Promise<boolean>;
  add(userId: string, productId: string): Promise<boolean>;
  remove(userId: string, productId: string): Promise<boolean>;
}

export interface CreateReviewInput {
  userId: string;
  productId: string;
  rating: number;
  body: string;
}

export interface ProductReviewRepository {
  listByProduct(productId: string): Promise<ProductReview[]>;
  findByUserAndProduct(userId: string, productId: string): Promise<ProductReview | undefined>;
  create(input: CreateReviewInput): Promise<ProductReview>;
  /** All star ratings for a product (for aggregate recalculation). */
  listRatings(productId: string): Promise<number[]>;
}

export interface CreateWantListInput {
  userId: string;
  preset: string;
  title: string;
  notes: string;
}

export interface NewsletterSubscribeResult {
  /** True when this email was newly added. */
  created: boolean;
  unsubscribeToken: string;
}

export interface NewsletterRepository {
  /** Upsert subscriber; returns whether the row was newly created + unsubscribe token. */
  subscribe(email: string): Promise<NewsletterSubscribeResult>;
  /** Removes the subscriber for this token. Returns false if the token was unknown. */
  unsubscribe(token: string): Promise<boolean>;
}

export interface WantListRepository {
  listByUser(userId: string): Promise<WantListItem[]>;
  listAll(): Promise<WantListAdminItem[]>;
  create(input: CreateWantListInput): Promise<WantListItem>;
  remove(userId: string, id: string): Promise<boolean>;
  updateStatus(
    id: string,
    input: { status: string; adminNote?: string | null },
  ): Promise<WantListAdminItem | undefined>;
}

export interface CreateRestorationSubmissionInput {
  email: string;
  notes: string;
  packageInterest: RestorationPackageId;
  photos: RestorationPhoto[];
}

export interface RestorationSubmissionRepository {
  create(input: CreateRestorationSubmissionInput): Promise<RestorationSubmission>;
  listAll(): Promise<RestorationSubmission[]>;
  updateStatus(
    id: string,
    input: { status: RestorationSubmissionStatus; adminNote?: string | null },
  ): Promise<RestorationSubmission | undefined>;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  orderId?: string;
}

export interface NotificationRepository {
  create(input: CreateNotificationInput): Promise<AppNotification>;
  listByUser(userId: string, limit?: number): Promise<AppNotification[]>;
  unreadCount(userId: string): Promise<number>;
  markRead(userId: string, ids?: string[]): Promise<number>;
}
