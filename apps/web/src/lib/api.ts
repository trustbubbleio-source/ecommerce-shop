import type {
  AuthResponse,
  CardCondition,
  CatalogStats,
  CheckoutInput,
  CheckoutSession,
  ContactInput,
  CreateProductInput,
  CreateProductReviewInput,
  FetchCardImageInput,
  ForgotPasswordInput,
  GoogleAuthInput,
  LoginInput,
  Order,
  Product,
  ProductCategory,
  ProductLanguage,
  ProductReview,
  PublicUser,
  RegisterInput,
  RegisterPendingResponse,
  ResetPasswordInput,
  SetPasswordInput,
  SortKey,
  UpdateProductInput,
  UpdateProfileInput,
  UpdateWantListStatusInput,
  VerifyEmailInput,
  WantListAdminItem,
  WantListItem,
  CreateWantListItemInput,
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
  listProductReviews(idOrSlug: string): Promise<{
    reviews: ProductReview[];
    canReview: boolean;
    myReview: ProductReview | null;
  }> {
    return request(`/products/${encodeURIComponent(idOrSlug)}/reviews`);
  },
  createProductReview(
    idOrSlug: string,
    input: CreateProductReviewInput,
  ): Promise<{ review: ProductReview }> {
    return request(`/products/${encodeURIComponent(idOrSlug)}/reviews`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  catalogMeta(): Promise<CatalogMeta> {
    return request('/products/meta');
  },
  register(input: RegisterInput): Promise<RegisterPendingResponse> {
    return request('/auth/register', { method: 'POST', body: JSON.stringify(input) });
  },
  verifyEmail(input: VerifyEmailInput): Promise<AuthResponse> {
    return request('/auth/verify-email', { method: 'POST', body: JSON.stringify(input) });
  },
  login(input: LoginInput): Promise<AuthResponse> {
    return request('/auth/login', { method: 'POST', body: JSON.stringify(input) });
  },
  googleAuth(input: GoogleAuthInput): Promise<AuthResponse> {
    return request('/auth/google', { method: 'POST', body: JSON.stringify(input) });
  },
  setPassword(input: SetPasswordInput): Promise<{ ok: boolean; user: PublicUser; message: string }> {
    return request('/auth/set-password', { method: 'POST', body: JSON.stringify(input) });
  },
  updateProfile(input: UpdateProfileInput): Promise<{ user: PublicUser }> {
    return request('/auth/me', { method: 'PATCH', body: JSON.stringify(input) });
  },
  forgotPassword(input: ForgotPasswordInput): Promise<{ ok: boolean; message: string }> {
    return request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(input) });
  },
  resetPassword(input: ResetPasswordInput): Promise<{ ok: boolean; message: string }> {
    return request('/auth/reset-password', { method: 'POST', body: JSON.stringify(input) });
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
  listFavorites(): Promise<{ products: Product[] }> {
    return request('/favorites');
  },
  listFavoriteIds(): Promise<{ productIds: string[] }> {
    return request('/favorites/ids');
  },
  addFavorite(productId: string): Promise<{ ok: boolean; productIds: string[] }> {
    return request(`/favorites/${encodeURIComponent(productId)}`, { method: 'POST' });
  },
  removeFavorite(productId: string): Promise<{ ok: boolean; productIds: string[] }> {
    return request(`/favorites/${encodeURIComponent(productId)}`, { method: 'DELETE' });
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
  submitSellRequest(formData: FormData): Promise<{ ok: boolean; message: string }> {
    return uploadRequest('/sell', formData);
  },
  listWantList(): Promise<{ items: WantListItem[] }> {
    return request('/want-list');
  },
  createWantListItem(input: CreateWantListItemInput): Promise<{ item: WantListItem }> {
    return request('/want-list', { method: 'POST', body: JSON.stringify(input) });
  },
  removeWantListItem(id: string): Promise<{ ok: boolean }> {
    return request(`/want-list/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  adminListWantList(): Promise<{ items: WantListAdminItem[] }> {
    return request('/admin/want-list');
  },
  adminUpdateWantListItem(
    id: string,
    input: UpdateWantListStatusInput,
  ): Promise<{ item: WantListAdminItem }> {
    return request(`/admin/want-list/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
};
