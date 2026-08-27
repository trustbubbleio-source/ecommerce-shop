import type {
  Address,
  CatalogStats,
  CreateProductInput,
  FulfillmentStep,
  Order,
  OrderLine,
  OrderStatus,
  Product,
  ProductFilter,
  ProductReview,
  SortKey,
  UpdateProfileInput,
  UserRole,
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
  markStatusBySession(sessionId: string, status: OrderStatus): Promise<Order | undefined>;
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

export interface ProductRepository {
  list(options?: ListOptions): Promise<Product[]>;
  listPage(options?: ListOptions): Promise<ProductPage>;
  getByIdOrSlug(idOrSlug: string): Promise<Product | undefined>;
  meta(): Promise<CatalogMeta>;
  catalogStats(): Promise<CatalogStats>;
  create(input: CreateProductInput): Promise<Product>;
  update(id: string, input: CreateProductInput): Promise<Product | undefined>;
  /** Sync catalogue aggregate stars after a new review. */
  setRatingStats(
    productId: string,
    stats: { rating: number; reviewCount: number },
  ): Promise<Product | undefined>;
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
