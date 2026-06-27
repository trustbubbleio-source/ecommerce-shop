import { describe, expect, it } from 'vitest';
import { jsonRequest, makeApp } from '../test/helpers.js';

const credentials = { name: 'Ash', email: 'ash@pallet.town', password: 'pikachu123' };

describe('POST /api/auth/register', () => {
  it('creates an account and returns a token', async () => {
    const { app } = makeApp();
    const { res, data } = await jsonRequest(app, 'POST', '/api/auth/register', credentials);
    expect(res.status).toBe(201);
    expect(data.token).toBeTypeOf('string');
    expect(data.user.email).toBe('ash@pallet.town');
    expect(data.user).not.toHaveProperty('passwordHash');
  });

  it('rejects a duplicate email', async () => {
    const { app } = makeApp();
    await jsonRequest(app, 'POST', '/api/auth/register', credentials);
    const { res } = await jsonRequest(app, 'POST', '/api/auth/register', credentials);
    expect(res.status).toBe(409);
  });

  it('validates the payload', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(app, 'POST', '/api/auth/register', {
      name: '',
      email: 'bad',
      password: 'x',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials', async () => {
    const { app } = makeApp();
    await jsonRequest(app, 'POST', '/api/auth/register', credentials);
    const { res, data } = await jsonRequest(app, 'POST', '/api/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });
    expect(res.status).toBe(200);
    expect(data.token).toBeTypeOf('string');
  });

  it('rejects a wrong password', async () => {
    const { app } = makeApp();
    await jsonRequest(app, 'POST', '/api/auth/register', credentials);
    const { res } = await jsonRequest(app, 'POST', '/api/auth/login', {
      email: credentials.email,
      password: 'wrong-password',
    });
    expect(res.status).toBe(401);
  });

  it('rejects an unknown email', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(app, 'POST', '/api/auth/login', {
      email: 'ghost@nowhere.com',
      password: 'whatever1',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user with a valid token', async () => {
    const { app } = makeApp();
    const { data } = await jsonRequest(app, 'POST', '/api/auth/register', credentials);
    const { res, data: me } = await jsonRequest(app, 'GET', '/api/auth/me', undefined, {
      authorization: `Bearer ${data.token}`,
    });
    expect(res.status).toBe(200);
    expect(me.user.email).toBe('ash@pallet.town');
  });

  it('rejects a request without a token', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(app, 'GET', '/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('ignores an invalid token', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(app, 'GET', '/api/auth/me', undefined, {
      authorization: 'Bearer garbage.token.here',
    });
    expect(res.status).toBe(401);
  });
});
