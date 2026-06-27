import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, setAuthToken } from './api';

function mockFetch(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const { ok = true, status = 200 } = init;
  const text = body === undefined ? '' : JSON.stringify(body);
  const fn = vi.fn().mockResolvedValue({ ok, status, text: () => Promise.resolve(text) });
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
  setAuthToken(null);
  vi.unstubAllGlobals();
});

describe('api client', () => {
  it('lists products and serializes the query (dropping empty/all values)', async () => {
    const fetchMock = mockFetch({ products: [], total: 0 });
    await api.listProducts({
      category: 'all',
      series: '',
      search: 'char',
      sort: 'price-asc',
      featured: true,
    });
    const url = fetchMock.mock.calls[0]![0] as string;
    expect(url).toContain('/api/products?');
    expect(url).toContain('search=char');
    expect(url).toContain('sort=price-asc');
    expect(url).toContain('featured=true');
    expect(url).not.toContain('category=');
    expect(url).not.toContain('series=');
  });

  it('requests a product by id/slug with encoding', async () => {
    const fetchMock = mockFetch({ product: {} });
    await api.getProduct('a/b');
    expect(fetchMock.mock.calls[0]![0]).toContain('/api/products/a%2Fb');
  });

  it('attaches the bearer token when set', async () => {
    const fetchMock = mockFetch({ user: {} });
    setAuthToken('tok_abc');
    await api.me();
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.get('authorization')).toBe('Bearer tok_abc');
  });

  it('sends JSON bodies for mutations', async () => {
    const fetchMock = mockFetch({ ok: true, message: 'ok' });
    await api.contact({ name: 'A', email: 'a@b.com', subject: 'Hi', message: 'A longer message.' });
    const [url, init] = fetchMock.mock.calls[0]! as [string, RequestInit];
    expect(url).toContain('/api/contact');
    expect(init.method).toBe('POST');
    expect((init.headers as Headers).get('content-type')).toBe('application/json');
  });

  it('throws ApiError with the server message on failure', async () => {
    mockFetch({ error: 'Nope' }, { ok: false, status: 400 });
    await expect(api.login({ email: 'a@b.com', password: 'x' })).rejects.toMatchObject({
      message: 'Nope',
      status: 400,
    });
  });

  it('falls back to a generic message when the body has no error', async () => {
    mockFetch(undefined, { ok: false, status: 500 });
    await expect(api.catalogMeta()).rejects.toBeInstanceOf(ApiError);
  });

  it('covers the remaining endpoints', async () => {
    const fetchMock = mockFetch({ ok: true });
    await api.register({ name: 'A', email: 'a@b.com', password: 'password1' });
    await api.checkout({ email: 'a@b.com', items: [{ productId: 'x', quantity: 1 }] });
    await api.getOrder('ord_1');
    await api.myOrders();
    const urls = fetchMock.mock.calls.map((c) => c[0]);
    expect(urls.some((u) => String(u).includes('/auth/register'))).toBe(true);
    expect(urls.some((u) => String(u).includes('/checkout'))).toBe(true);
    expect(urls.some((u) => String(u).includes('/orders/ord_1'))).toBe(true);
    expect(urls.some((u) => String(u).endsWith('/orders'))).toBe(true);
  });
});
