import type { Product } from '@akknerds/shared';
import { ToastProvider } from '@akknerds/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type RenderOptions, type RenderResult, render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, RouterProvider, createMemoryRouter, useLocation } from 'react-router-dom';
import { routes } from '../router';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface ProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  client?: QueryClient;
}

/** Render an isolated component with Query, Toast and Router context. */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', client = createTestQueryClient(), ...options }: ProvidersOptions = {},
): RenderResult & { client: QueryClient } {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <ToastProvider>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );
  }
  return { client, ...render(ui, { wrapper: Wrapper, ...options }) };
}

/** Render the full application router starting at a path (integration tests). */
export function renderApp(
  initialPath = '/',
  client = createTestQueryClient(),
): RenderResult & { client: QueryClient } {
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryClientProvider>,
    ),
  };
}

/** Tiny component that surfaces the current pathname for navigation assertions. */
export function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'bb-151',
    slug: 'pokemon-151-booster-box-bb-151',
    name: 'Pokémon 151 Booster Box',
    description: 'A sealed booster box.',
    category: 'booster-box',
    set: '151',
    series: 'Scarlet & Violet',
    price: 16999,
    compareAtPrice: 18999,
    currency: 'usd',
    accent: '#ef4444',
    stock: 10,
    featured: true,
    isNew: true,
    rating: 4.9,
    reviewCount: 120,
    tags: ['sealed'],
    images: [],
    language: 'english',
    releaseDate: '2023-09-22',
    ...overrides,
  };
}
