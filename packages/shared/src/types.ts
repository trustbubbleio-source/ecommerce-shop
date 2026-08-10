/**
 * Domain types shared between the web storefront and the API.
 * Monetary values are always integers in the smallest currency unit (cents).
 */

export type {
  CardCondition,
  CardRarity,
  ProductCategory,
  ProductLanguage,
  ProductSeries,
  ProductSet,
} from './enums.js';

export type UserRole = 'customer' | 'admin';

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: import('./enums.js').ProductCategory;
  /** Set name, e.g. "151" or "Obsidian Flames". */
  set: import('./enums.js').ProductSet;
  /** Series the set belongs to, e.g. "Scarlet & Violet". */
  series: import('./enums.js').ProductSeries;
  /** Current price in cents. */
  price: number;
  /** Original price in cents when discounted; absent if not on sale. */
  compareAtPrice?: number;
  currency: string;
  /** CDN-relative paths (primary image first). Served via CloudFront. */
  images: string[];
  /** @deprecated Prefer images[0]. Kept for backward compatibility. */
  image?: string;
  /** Hex accent used by the generated product art. */
  accent: string;
  stock: number;
  featured: boolean;
  isNew: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  rarity?: import('./enums.js').CardRarity;
  condition?: import('./enums.js').CardCondition;
  /** Card/product print language. */
  language: import('./enums.js').ProductLanguage;
  /** Collector number, e.g. "178/165". Shown on shop card previews. */
  cardNumber?: string;
  releaseDate: string;
}

export interface CartLine {
  productId: string;
  quantity: number;
}

export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'cancelled';

export interface OrderLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface Address {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  userId?: string;
  email: string;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  status: OrderStatus;
  stripeSessionId?: string;
  shippingAddress?: Address;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

export interface CheckoutSession {
  /** URL to redirect the customer to (Stripe Checkout). */
  url: string;
  orderId: string;
}

export interface ApiError {
  error: string;
  details?: unknown;
}
