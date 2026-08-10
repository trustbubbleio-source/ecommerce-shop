import type {
  AuthResponse,
  CardCondition,
  CatalogStats,
  CheckoutInput,
  CheckoutSession,
  ContactInput,
  CreateProductInput,
  FetchCardImageInput,
  LoginInput,
  Order,
  Product,
  ProductCategory,
  ProductLanguage,
  PublicUser,
  RegisterInput,
  SortKey,
  UpdateProductInput,
} from '@akknerds/shared';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export interface CatalogMeta {
  categories: { value: ProductCategory; count: number }[];
  series: readonly string[];
  sets: readonly string[];
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
  language?: ProductLanguage;
  condition?: CardCondition;
  featured?: boolean;
  isNew?: boolean;
  limit?: number;
  offset?: number;
}

export interface ProductsListResponse {
  products: Product[];
  total: number;
  limit?: number | null;
  offset?: number;
  hasMore?: boolean;
}

/** Default page size for the shop catalogue (mobile-friendly grid batches). */
export const SHOP_PAGE_SIZE = 24;

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

async function uploadRequest<T>(path: string, formData: FormData): Promise<T> {
  const headers = new Headers();
  if (authToken) headers.set('authorization', `Bearer ${authToken}`);

  const res = await fetch(`${BASE_URL}/api${path}`, { method: 'POST', headers, body: formData });
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
  listProducts(query: ProductsQuery = {}): Promise<ProductsListResponse> {
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
  adminListProducts(): Promise<{ products: Product[]; total: number; stats: CatalogStats }> {
    return request('/admin/products');
  },
  adminGetProduct(id: string): Promise<{ product: Product }> {
    return request(`/admin/products/${encodeURIComponent(id)}`);
  },
  adminUploadImages(files: File[]): Promise<{ keys: string[] }> {
    const formData = new FormData();
    for (const file of files) formData.append('images', file);
    return uploadRequest('/admin/uploads', formData);
  },
  adminFetchCardImage(input: FetchCardImageInput): Promise<{
    key: string;
    previewUrl?: string;
    cardName?: string;
    cardNumber?: number;
    cached: boolean;
  }> {
    return request('/admin/card-image', { method: 'POST', body: JSON.stringify(input) });
  },
  adminFetchCardPrice(input: FetchCardImageInput): Promise<{
    priceCents: number;
    cardName: string;
    cardNumber: number;
    sourceUrl: string;
  }> {
    return request('/admin/card-price', { method: 'POST', body: JSON.stringify(input) });
  },
  adminSyncPrices(): Promise<{
    outcomes: Array<{
      productId: string;
      productName: string;
      status: 'updated' | 'skipped' | 'error';
      priceCents?: number;
      sourceUrl?: string;
      message?: string;
    }>;
    summary: { updated: number; skipped: number; errors: number };
  }> {
    return request('/admin/sync-prices', { method: 'POST' });
  },
  adminCreateProduct(input: CreateProductInput): Promise<{ product: Product }> {
    return request('/admin/products', { method: 'POST', body: JSON.stringify(input) });
  },
  adminUpdateProduct(id: string, input: UpdateProductInput): Promise<{ product: Product }> {
    return request(`/admin/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  contact(input: ContactInput): Promise<{ ok: boolean; message: string }> {
    return request('/contact', { method: 'POST', body: JSON.stringify(input) });
  },
};
