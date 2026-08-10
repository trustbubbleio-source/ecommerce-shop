import { describe, expect, it } from 'vitest';
import { jsonRequest, makeApp } from '../test/helpers.js';

describe('GET /api/products', () => {
  it('lists all products', async () => {
    const { app } = makeApp();
    const { res, data } = await jsonRequest(app, 'GET', '/api/products');
    expect(res.status).toBe(200);
    expect(data.products.length).toBeGreaterThan(0);
    expect(data.total).toBe(data.products.length);
    expect(data.hasMore).toBe(false);
  });

  it('pages with limit and offset and reports hasMore', async () => {
    const { app } = makeApp();
    const { data: first } = await jsonRequest(app, 'GET', '/api/products?limit=2&offset=0');
    expect(first.products).toHaveLength(2);
    expect(first.total).toBeGreaterThan(2);
    expect(first.hasMore).toBe(true);
    expect(first.offset).toBe(0);
    expect(first.limit).toBe(2);

    const { data: second } = await jsonRequest(app, 'GET', '/api/products?limit=2&offset=2');
    expect(second.products).toHaveLength(2);
    expect(second.products[0].id).not.toBe(first.products[0].id);
    expect(second.offset).toBe(2);
  });

  it('filters by category', async () => {
    const { app } = makeApp();
    const { data } = await jsonRequest(app, 'GET', '/api/products?category=booster-box');
    expect(data.products.every((p: { category: string }) => p.category === 'booster-box')).toBe(
      true,
    );
  });

  it('filters featured products and respects limit', async () => {
    const { app } = makeApp();
    const { data } = await jsonRequest(app, 'GET', '/api/products?featured=true&limit=2');
    expect(data.products.length).toBeLessThanOrEqual(2);
    expect(data.products.every((p: { featured: boolean }) => p.featured)).toBe(true);
  });

  it('sorts by price ascending', async () => {
    const { app } = makeApp();
    const { data } = await jsonRequest(app, 'GET', '/api/products?sort=price-asc');
    const prices = data.products.map((p: { price: number }) => p.price);
    expect([...prices]).toEqual([...prices].sort((a, b) => a - b));
  });

  it('searches by keyword', async () => {
    const { app } = makeApp();
    const { data } = await jsonRequest(app, 'GET', '/api/products?search=charizard');
    expect(data.products.length).toBeGreaterThan(0);
  });

  it('filters by language and condition', async () => {
    const { app } = makeApp();
    const { data: singles } = await jsonRequest(app, 'GET', '/api/products?category=single-card');
    const sample = singles.products.find(
      (p: { language?: string; condition?: string }) => p.language && p.condition,
    );
    if (!sample) return;
    const { data } = await jsonRequest(
      app,
      'GET',
      `/api/products?language=${sample.language}&condition=${sample.condition}`,
    );
    expect(data.products.length).toBeGreaterThan(0);
    expect(
      data.products.every(
        (p: { language?: string; condition?: string }) =>
          p.language === sample.language && p.condition === sample.condition,
      ),
    ).toBe(true);
  });

  it('rejects an invalid sort value', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(app, 'GET', '/api/products?sort=bogus');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/products/meta', () => {
  it('returns categories, series and a price range', async () => {
    const { app } = makeApp();
    const { res, data } = await jsonRequest(app, 'GET', '/api/products/meta');
    expect(res.status).toBe(200);
    expect(data.categories.length).toBeGreaterThan(0);
    expect(data.series.length).toBeGreaterThan(0);
    expect(data.priceRange.max).toBeGreaterThanOrEqual(data.priceRange.min);
  });
});

describe('GET /api/products/:idOrSlug', () => {
  it('finds a product by id', async () => {
    const { app } = makeApp();
    const { res, data } = await jsonRequest(app, 'GET', '/api/products/bb-151');
    expect(res.status).toBe(200);
    expect(data.product.id).toBe('bb-151');
  });

  it('finds a product by slug', async () => {
    const { app } = makeApp();
    const { data: list } = await jsonRequest(app, 'GET', '/api/products');
    const slug = list.products[0].slug;
    const { res, data } = await jsonRequest(app, 'GET', `/api/products/${slug}`);
    expect(res.status).toBe(200);
    expect(data.product.slug).toBe(slug);
  });

  it('returns 404 for an unknown product', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(app, 'GET', '/api/products/nope');
    expect(res.status).toBe(404);
  });
});
