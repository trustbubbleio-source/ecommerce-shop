import type {
  AuthResponse,
  CatalogStats,
  CheckoutInput,
  CheckoutSession,
  ContactInput,
  CreateProductInput,
  CreateProductReviewInput,
  CreateWantListItemInput,
  FetchCardImageInput,
  ForgotPasswordInput,
  GoogleAuthInput,
  LoginInput,
  Order,
  Product,
  ProductReview,
  PublicUser,
  RegisterInput,
  RegisterPendingResponse,
  ResetPasswordInput,
  SetPasswordInput,
  UpdateProductInput,
  UpdateProfileInput,
  UpdateWantListStatusInput,
  UpdateOrderFulfillmentInput,
  VerifyEmailInput,
  WantListAdminItem,
  WantListItem,
} from '@akknerds/shared';
import { ApiError } from './error.js';
import { toQueryString } from './query.js';
import type {
  ApiClientConfig,
  AdminProductsQuery,
  CatalogMeta,
  ProductsListResponse,
  ProductsQuery,
} from './types.js';

export interface ApiClient {
  setAuthToken(token: string | null): void;
  listProducts(query?: ProductsQuery): Promise<ProductsListResponse>;
  getProduct(idOrSlug: string): Promise<{ product: Product }>;
  listProductReviews(idOrSlug: string): Promise<{
    reviews: ProductReview[];
    canReview: boolean;
    myReview: ProductReview | null;
  }>;
  createProductReview(
    idOrSlug: string,
    input: CreateProductReviewInput,
  ): Promise<{ review: ProductReview }>;
  catalogMeta(): Promise<CatalogMeta>;
  register(input: RegisterInput): Promise<RegisterPendingResponse>;
  verifyEmail(input: VerifyEmailInput): Promise<AuthResponse>;
  login(input: LoginInput): Promise<AuthResponse>;
  googleAuth(input: GoogleAuthInput): Promise<AuthResponse>;
  setPassword(input: SetPasswordInput): Promise<{ ok: boolean; user: PublicUser; message: string }>;
  updateProfile(input: UpdateProfileInput): Promise<{ user: PublicUser }>;
  forgotPassword(input: ForgotPasswordInput): Promise<{ ok: boolean; message: string }>;
  resetPassword(input: ResetPasswordInput): Promise<{ ok: boolean; message: string }>;
  me(): Promise<{ user: PublicUser }>;
  checkout(input: CheckoutInput): Promise<CheckoutSession>;
  getOrder(id: string): Promise<{ order: Order }>;
  myOrders(): Promise<{ orders: Order[] }>;
  listFavorites(): Promise<{ products: Product[] }>;
  listFavoriteIds(): Promise<{ productIds: string[] }>;
  addFavorite(productId: string): Promise<{ ok: boolean; productIds: string[] }>;
  removeFavorite(productId: string): Promise<{ ok: boolean; productIds: string[] }>;
  adminListProducts(query?: AdminProductsQuery): Promise<{
    products: Product[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    stats: CatalogStats;
  }>;
  adminGetProduct(id: string): Promise<{ product: Product }>;
  adminUploadImages(files: File[]): Promise<{ keys: string[] }>;
  adminFetchCardImage(input: FetchCardImageInput): Promise<{
    key: string;
    previewUrl?: string;
    cardName?: string;
    cardNumber?: number;
    cached: boolean;
  }>;
  adminFetchCardPrice(input: FetchCardImageInput): Promise<{
    priceCents: number;
    cardName: string;
    cardNumber: number;
    sourceUrl: string;
  }>;
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
  }>;
  adminCreateProduct(input: CreateProductInput): Promise<{ product: Product }>;
  adminUpdateProduct(id: string, input: UpdateProductInput): Promise<{ product: Product }>;
  contact(input: ContactInput): Promise<{ ok: boolean; message: string }>;
  submitSellRequest(formData: FormData): Promise<{ ok: boolean; message: string }>;
  listWantList(): Promise<{ items: WantListItem[] }>;
  createWantListItem(input: CreateWantListItemInput): Promise<{ item: WantListItem }>;
  removeWantListItem(id: string): Promise<{ ok: boolean }>;
  adminListWantList(): Promise<{ items: WantListAdminItem[] }>;
  adminUpdateWantListItem(
    id: string,
    input: UpdateWantListStatusInput,
  ): Promise<{ item: WantListAdminItem }>;
  adminListOrders(): Promise<{ orders: Order[] }>;
  adminGetOrder(id: string): Promise<{ order: Order }>;
  adminUpdateOrder(
    id: string,
    input: UpdateOrderFulfillmentInput,
  ): Promise<{ order: Order }>;
}

/**
 * Typed HTTP client for the One More Rip API.
 * Zod schemas / domain types live in `@akknerds/shared` — validate inputs there
 * (or on the server); this package owns paths, fetch, and response typing.
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  let authToken: string | null = null;

  function doFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const impl = config.fetch ?? globalThis.fetch;
    return impl(input, init);
  }

  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (options.body) headers.set('content-type', 'application/json');
    if (authToken) headers.set('authorization', `Bearer ${authToken}`);

    const res = await doFetch(`${baseUrl}/api${path}`, { ...options, headers });
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

    const res = await doFetch(`${baseUrl}/api${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const message =
        (data && typeof data.error === 'string' && data.error) || `Request failed (${res.status})`;
      throw new ApiError(message, res.status, data?.details);
    }
    return data as T;
  }

  return {
    setAuthToken(token: string | null) {
      authToken = token;
    },
    listProducts(query: ProductsQuery = {}) {
      return request(`/products${toQueryString(query)}`);
    },
    getProduct(idOrSlug: string) {
      return request(`/products/${encodeURIComponent(idOrSlug)}`);
    },
    listProductReviews(idOrSlug: string) {
      return request(`/products/${encodeURIComponent(idOrSlug)}/reviews`);
    },
    createProductReview(idOrSlug, input) {
      return request(`/products/${encodeURIComponent(idOrSlug)}/reviews`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    catalogMeta() {
      return request('/products/meta');
    },
    register(input) {
      return request('/auth/register', { method: 'POST', body: JSON.stringify(input) });
    },
    verifyEmail(input) {
      return request('/auth/verify-email', { method: 'POST', body: JSON.stringify(input) });
    },
    login(input) {
      return request('/auth/login', { method: 'POST', body: JSON.stringify(input) });
    },
    googleAuth(input) {
      return request('/auth/google', { method: 'POST', body: JSON.stringify(input) });
    },
    setPassword(input) {
      return request('/auth/set-password', { method: 'POST', body: JSON.stringify(input) });
    },
    updateProfile(input) {
      return request('/auth/me', { method: 'PATCH', body: JSON.stringify(input) });
    },
    forgotPassword(input) {
      return request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(input) });
    },
    resetPassword(input) {
      return request('/auth/reset-password', { method: 'POST', body: JSON.stringify(input) });
    },
    me() {
      return request('/auth/me');
    },
    checkout(input) {
      return request('/checkout', { method: 'POST', body: JSON.stringify(input) });
    },
    getOrder(id) {
      return request(`/orders/${encodeURIComponent(id)}`);
    },
    myOrders() {
      return request('/orders');
    },
    listFavorites() {
      return request('/favorites');
    },
    listFavoriteIds() {
      return request('/favorites/ids');
    },
    addFavorite(productId) {
      return request(`/favorites/${encodeURIComponent(productId)}`, { method: 'POST' });
    },
    removeFavorite(productId) {
      return request(`/favorites/${encodeURIComponent(productId)}`, { method: 'DELETE' });
    },
    adminListProducts(query: AdminProductsQuery = {}) {
      return request(`/admin/products${toQueryString(query)}`);
    },
    adminGetProduct(id) {
      return request(`/admin/products/${encodeURIComponent(id)}`);
    },
    adminUploadImages(files) {
      const formData = new FormData();
      for (const file of files) formData.append('images', file);
      return uploadRequest('/admin/uploads', formData);
    },
    adminFetchCardImage(input) {
      return request('/admin/card-image', { method: 'POST', body: JSON.stringify(input) });
    },
    adminFetchCardPrice(input) {
      return request('/admin/card-price', { method: 'POST', body: JSON.stringify(input) });
    },
    adminSyncPrices() {
      return request('/admin/sync-prices', { method: 'POST' });
    },
    adminCreateProduct(input) {
      return request('/admin/products', { method: 'POST', body: JSON.stringify(input) });
    },
    adminUpdateProduct(id, input) {
      return request(`/admin/products/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },
    contact(input) {
      return request('/contact', { method: 'POST', body: JSON.stringify(input) });
    },
    submitSellRequest(formData) {
      return uploadRequest('/sell', formData);
    },
    listWantList() {
      return request('/want-list');
    },
    createWantListItem(input) {
      return request('/want-list', { method: 'POST', body: JSON.stringify(input) });
    },
    removeWantListItem(id) {
      return request(`/want-list/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
    adminListWantList() {
      return request('/admin/want-list');
    },
    adminUpdateWantListItem(id, input) {
      return request(`/admin/want-list/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },
    adminListOrders() {
      return request('/admin/orders');
    },
    adminGetOrder(id) {
      return request(`/admin/orders/${encodeURIComponent(id)}`);
    },
    adminUpdateOrder(id, input) {
      return request(`/admin/orders/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },
  };
}
