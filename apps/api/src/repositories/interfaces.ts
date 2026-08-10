import type {
  Address,
  CatalogStats,
  CreateProductInput,
  Order,
  OrderLine,
  OrderStatus,
  Product,
  ProductFilter,
  SortKey,
  UserRole,
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
  create(input: {
    email: string;
    name: string;
    passwordHash: string;
    role?: UserRole;
  }): Promise<StoredUser>;
}

export interface OrderRepository {
  create(input: CreateOrderInput): Promise<Order>;
  get(id: string): Promise<Order | undefined>;
  attachSession(orderId: string, sessionId: string): Promise<void>;
  markStatusBySession(sessionId: string, status: OrderStatus): Promise<Order | undefined>;
  setStatus(orderId: string, status: OrderStatus): Promise<Order | undefined>;
  listByUser(userId: string): Promise<Order[]>;
}

export interface ListOptions {
  filter?: ProductFilter;
  sort?: SortKey;
  featured?: boolean;
  isNew?: boolean;
  limit?: number;
  offset?: number;
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
}
