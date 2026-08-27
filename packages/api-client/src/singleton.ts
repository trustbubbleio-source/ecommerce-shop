import { createApiClient, type ApiClient } from './client.js';
import type { ApiClientConfig } from './types.js';

/**
 * Shared singleton. Call `configureApiClient` once at app startup
 * (web `main.tsx` / test setup). ESM live-binding: reassign updates importers.
 */
export let api: ApiClient = createApiClient({ baseUrl: 'http://localhost:4000' });

/** Kept outside the client instance so `configureApiClient` does not drop auth. */
let authToken: string | null = null;

export function configureApiClient(config: ApiClientConfig): ApiClient {
  api = createApiClient(config);
  api.setAuthToken(authToken);
  return api;
}

export function getApiClient(): ApiClient {
  return api;
}

export function setAuthToken(token: string | null): void {
  authToken = token;
  api.setAuthToken(token);
}
