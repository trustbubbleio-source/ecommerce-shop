export { ApiError } from './error.js';
export { createApiClient, type ApiClient } from './client.js';
export { api, configureApiClient, getApiClient, setAuthToken } from './singleton.js';
export { toQueryString } from './query.js';
export {
  ADMIN_PRODUCTS_PAGE_SIZE,
  SHOP_PAGE_SIZE,
  type ApiClientConfig,
  type AdminProductSortKey,
  type AdminProductsQuery,
  type CatalogMeta,
  type ProductsListResponse,
  type ProductsQuery,
} from './types.js';
