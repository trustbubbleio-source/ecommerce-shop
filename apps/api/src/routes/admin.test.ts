import { describe, expect, it } from 'vitest';
import { hashPassword } from '../lib/password.js';
import { StorageService } from '../lib/storage.js';
import { jsonRequest, makeApp } from '../test/helpers.js';

const adminCreds = { name: 'Admin', email: 'admin@test.local', password: 'adminpass123' };

async function seedAdmin(deps: Awaited<ReturnType<typeof makeApp>>['deps']) {
  const passwordHash = await hashPassword(adminCreds.password);
  return deps.users.create({
    ...adminCreds,
    passwordHash,
    role: 'admin',
    emailVerifiedAt: new Date().toISOString(),
  });
}

describe('GET /api/admin/products', () => {
  it('rejects unauthenticated requests', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(app, 'GET', '/api/admin/products');
    expect(res.status).toBe(401);
  });

  it('rejects non-admin users', async () => {
    const { app, deps } = makeApp();
    const passwordHash = await hashPassword('pikachu123');
    await deps.users.create({
      name: 'Ash',
      email: 'ash@pallet.town',
      passwordHash,
      emailVerifiedAt: new Date().toISOString(),
    });
    const { data } = await jsonRequest(app, 'POST', '/api/auth/login', {
      email: 'ash@pallet.town',
      password: 'pikachu123',
    });
    const { res } = await jsonRequest(app, 'GET', '/api/admin/products', undefined, {
      authorization: `Bearer ${data.token}`,
    });
    expect(res.status).toBe(403);
  });

  it('returns products for an admin', async () => {
    const { app, deps } = makeApp();
    await seedAdmin(deps);
    const { data: login } = await jsonRequest(app, 'POST', '/api/auth/login', {
      email: adminCreds.email,
      password: adminCreds.password,
    });
    expect(login.user.role).toBe('admin');

    const { res, data } = await jsonRequest(app, 'GET', '/api/admin/products', undefined, {
      authorization: `Bearer ${login.token}`,
    });
    expect(res.status).toBe(200);
    expect(data.products.length).toBeGreaterThan(0);
    expect(data.total).toBe(data.products.length);
    expect(data.stats).toMatchObject({
      listings: data.total,
      unitsInStock: expect.any(Number),
      inventoryValueCents: expect.any(Number),
    });
    const expectedValue = data.products.reduce(
      (sum: number, product: { price: number; stock: number }) =>
        sum + product.price * Math.max(0, product.stock),
      0,
    );
    expect(data.stats.inventoryValueCents).toBe(expectedValue);
  });
});

describe('POST /api/auth/register', () => {
  it('always creates a customer account', async () => {
    const { app, deps } = makeApp();
    await jsonRequest(app, 'POST', '/api/auth/register', {
      email: 'misty@cerulean.city',
    });
    const user = await deps.users.findByEmail('misty@cerulean.city');
    expect(user?.role).toBe('customer');
  });
});

describe('POST /api/admin/card-image', () => {
  it('rejects unauthenticated requests', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(app, 'POST', '/api/admin/card-image', {
      category: 'single-card',
      series: 'Mega Evolution',
      set: 'Ascended Heroes',
      cardNumber: '286',
      language: 'english',
    });
    expect(res.status).toBe(401);
  });

  it('returns 503 when storage is disabled', async () => {
    const { app, deps } = makeApp({
      storage: new StorageService({
        enabled: false,
        accessKeyId: '',
        secretAccessKey: '',
        region: '',
        bucket: '',
        cloudfrontUrl: '',
      }),
    });
    await seedAdmin(deps);
    const { data: login } = await jsonRequest(app, 'POST', '/api/auth/login', {
      email: adminCreds.email,
      password: adminCreds.password,
    });

    const { res } = await jsonRequest(
      app,
      'POST',
      '/api/admin/card-image',
      {
        category: 'single-card',
        series: 'Mega Evolution',
        set: 'Ascended Heroes',
        cardNumber: '286',
        language: 'english',
      },
      { authorization: `Bearer ${login.token}` },
    );
    expect(res.status).toBe(503);
  });
});

describe('POST /api/admin/products', () => {
  it('creates a product for an admin', async () => {
    const { app, deps } = makeApp();
    await seedAdmin(deps);
    const { data: login } = await jsonRequest(app, 'POST', '/api/auth/login', {
      email: adminCreds.email,
      password: adminCreds.password,
    });

    const { res, data } = await jsonRequest(
      app,
      'POST',
      '/api/admin/products',
      {
        name: 'Test Booster Pack',
        description: 'A sealed test booster pack for admin CRUD.',
        category: 'booster-pack',
        set: 'Temporal Forces',
        series: 'Scarlet & Violet',
        price: 599,
        stock: 12,
        accent: '#a855f7',
        images: ['products/test-pack.jpg'],
        releaseDate: '2024-01-01',
        language: 'english',
        rarity: 'rare',
        condition: 'near-mint',
      },
      { authorization: `Bearer ${login.token}` },
    );

    expect(res.status).toBe(201);
    expect(data.product.name).toBe('Test Booster Pack');
    expect(data.product.images).toEqual(['products/test-pack.jpg']);
  });
});

describe('GET /api/admin/products/:id', () => {
  it('returns a product for an admin', async () => {
    const { app, deps } = makeApp();
    await seedAdmin(deps);
    const { data: login } = await jsonRequest(app, 'POST', '/api/auth/login', {
      email: adminCreds.email,
      password: adminCreds.password,
    });
    const { data: created } = await jsonRequest(
      app,
      'POST',
      '/api/admin/products',
      {
        name: 'Edit Me Pack',
        description: 'Pack to edit later.',
        category: 'booster-pack',
        set: 'Temporal Forces',
        series: 'Scarlet & Violet',
        price: 499,
        stock: 5,
        accent: '#a855f7',
        images: ['products/edit-me.jpg'],
        releaseDate: '2024-06-01',
        language: 'english',
        rarity: 'rare',
        condition: 'near-mint',
      },
      { authorization: `Bearer ${login.token}` },
    );

    const { res, data } = await jsonRequest(
      app,
      'GET',
      `/api/admin/products/${created.product.id}`,
      undefined,
      { authorization: `Bearer ${login.token}` },
    );
    expect(res.status).toBe(200);
    expect(data.product.id).toBe(created.product.id);
  });
});

describe('PATCH /api/admin/products/:id', () => {
  it('updates a product for an admin', async () => {
    const { app, deps } = makeApp();
    await seedAdmin(deps);
    const { data: login } = await jsonRequest(app, 'POST', '/api/auth/login', {
      email: adminCreds.email,
      password: adminCreds.password,
    });
    const { data: created } = await jsonRequest(
      app,
      'POST',
      '/api/admin/products',
      {
        name: 'Price Change Pack',
        description: 'Original description.',
        category: 'booster-pack',
        set: 'Temporal Forces',
        series: 'Scarlet & Violet',
        price: 499,
        stock: 5,
        accent: '#a855f7',
        images: ['products/price-change.jpg'],
        releaseDate: '2024-06-01',
        language: 'english',
        rarity: 'rare',
        condition: 'near-mint',
      },
      { authorization: `Bearer ${login.token}` },
    );

    const { res, data } = await jsonRequest(
      app,
      'PATCH',
      `/api/admin/products/${created.product.id}`,
      {
        name: 'Price Change Pack',
        description: 'Updated description.',
        category: 'booster-pack',
        set: 'Temporal Forces',
        series: 'Scarlet & Violet',
        price: 799,
        stock: 2,
        accent: '#a855f7',
        images: ['products/price-change.jpg'],
        releaseDate: '2024-06-01',
        language: 'english',
        rarity: 'rare',
        condition: 'near-mint',
      },
      { authorization: `Bearer ${login.token}` },
    );

    expect(res.status).toBe(200);
    expect(data.product.price).toBe(799);
    expect(data.product.stock).toBe(2);
    expect(data.product.description).toBe('Updated description.');
  });
});
