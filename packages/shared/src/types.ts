/**
 * Domain types shared between the web storefront and the API.
 * Monetary values are always integers in the smallest currency unit (cents).
 */

export type ProductCategory =
  | 'booster-box'
  | 'elite-trainer-box'
  | 'booster-pack'
  | 'single-card'
  | 'bundle'
  | 'accessory';

export type CardRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'holo-rare'
  | 'ultra-rare'
  | 'secret-rare'
  | 'illustration-rare';

export type CardCondition = 'mint' | 'near-mint' | 'lightly-played' | 'moderately-played';

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ProductCategory;
  /** Set name, e.g. "151" or "Obsidian Flames". */
  set: string;
  /** Series the set belongs to, e.g. "Scarlet & Violet". */
  series: string;
  /** Current price in cents. */
  price: number;
  /** Original price in cents when discounted; absent if not on sale. */
  compareAtPrice?: number;
  currency: string;
  /** Optional real image URL; the UI renders branded art when absent. */
  image?: string;
  /** Hex accent used by the generated product art. */
  accent: string;
  stock: number;
  featured: boolean;
  isNew: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  rarity?: CardRarity;
  condition?: CardCondition;
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
