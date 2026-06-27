import type {
  AuthResponse,
  CheckoutInput,
  CheckoutSession,
  ContactInput,
  LoginInput,
  Order,
  Product,
  ProductCategory,
  PublicUser,
  RegisterInput,
  SortKey,
} from '@akknerds/shared';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export interface CatalogMeta {
  categories: { value: ProductCategory; count: number }[];
  series: string[];
  priceRange: { min: number; max: number };
}

export interface ProductsQuery {
  category?: ProductCategory | 'all';
  series?: string;
  search?: string;
  sort?: SortKey;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  isNew?: boolean;
  limit?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let authToken: string | null = null;

/** Set the bearer token attached to subsequent requests (called by the auth store). */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('content-type', 'application/json');
  if (authToken) headers.set('authorization', `Bearer ${authToken}`);

  const res = await fetch(`${BASE_URL}/api${path}`, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (data && typeof data.error === 'string' && data.error) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data?.details);
  }
  return data as T;
}

function toQueryString(query: ProductsQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '' || value === 'all') continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  listProducts(query: ProductsQuery = {}): Promise<{ products: Product[]; total: number }> {
    return request(`/products${toQueryString(query)}`);
  },
  getProduct(idOrSlug: string): Promise<{ product: Product }> {
    return request(`/products/${encodeURIComponent(idOrSlug)}`);
  },
  catalogMeta(): Promise<CatalogMeta> {
    return request('/products/meta');
  },
  register(input: RegisterInput): Promise<AuthResponse> {
    return request('/auth/register', { method: 'POST', body: JSON.stringify(input) });
  },
  login(input: LoginInput): Promise<AuthResponse> {
    return request('/auth/login', { method: 'POST', body: JSON.stringify(input) });
  },
  me(): Promise<{ user: PublicUser }> {
    return request('/auth/me');
  },
  checkout(input: CheckoutInput): Promise<CheckoutSession> {
    return request('/checkout', { method: 'POST', body: JSON.stringify(input) });
  },
  getOrder(id: string): Promise<{ order: Order }> {
    return request(`/orders/${encodeURIComponent(id)}`);
  },
  myOrders(): Promise<{ orders: Order[] }> {
    return request('/orders');
  },
  contact(input: ContactInput): Promise<{ ok: boolean; message: string }> {
    return request('/contact', { method: 'POST', body: JSON.stringify(input) });
  },
};
