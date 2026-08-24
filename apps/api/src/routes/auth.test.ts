import { describe, expect, it, vi } from 'vitest';
import type { EmailService } from '../lib/email.js';
import { hashPassword } from '../lib/password.js';
import { jsonRequest, makeApp } from '../test/helpers.js';

const credentials = { email: 'ash@pallet.town', password: 'pikachu123' };

function mockEmail(): EmailService {
  return {
    enabled: false,
    send: vi.fn().mockResolvedValue({ id: 'mock', mocked: true }),
    sendContactMessage: vi.fn().mockResolvedValue({ id: 'mock', mocked: true }),
    sendWelcome: vi.fn().mockResolvedValue({ id: 'mock', mocked: true }),
    sendEmailVerification: vi.fn().mockResolvedValue({ id: 'mock', mocked: true }),
    sendPasswordReset: vi.fn().mockResolvedValue({ id: 'mock', mocked: true }),
  } as unknown as EmailService;
}

async function registerAndConfirm(email: EmailService = mockEmail()) {
  const created = makeApp({ email });
  const { res, data } = await jsonRequest(created.app, 'POST', '/api/auth/register', {
    email: credentials.email,
  });
  expect(res.status).toBe(201);
  expect(data.ok).toBe(true);
  expect(email.sendEmailVerification).toHaveBeenCalledOnce();
  const verifyUrl = vi.mocked(email.sendEmailVerification).mock.calls[0]?.[0].verifyUrl ?? '';
  const token = new URL(verifyUrl).searchParams.get('token');
  expect(token).toBeTruthy();
  const verified = await jsonRequest(created.app, 'POST', '/api/auth/verify-email', { token });
  expect(verified.res.status).toBe(200);
  expect(verified.data.mustSetPassword).toBe(true);
  return { ...created, email, session: verified.data };
}

describe('POST /api/auth/register', () => {
  it('creates a pending account from email only and sends confirmation', async () => {
    const email = mockEmail();
    const { app } = makeApp({ email });
    const { res, data } = await jsonRequest(app, 'POST', '/api/auth/register', {
      email: credentials.email,
    });
    expect(res.status).toBe(201);
    expect(data.ok).toBe(true);
    expect(data.token).toBeUndefined();
    expect(email.sendEmailVerification).toHaveBeenCalledOnce();
  });

  it('rejects a duplicate verified email', async () => {
    const { app, session } = await registerAndConfirm();
    await jsonRequest(app, 'POST', '/api/auth/set-password', { password: credentials.password }, {
      authorization: `Bearer ${session.token}`,
    });
    const { res } = await jsonRequest(app, 'POST', '/api/auth/register', {
      email: credentials.email,
    });
    expect(res.status).toBe(409);
  });

  it('validates the payload', async () => {
    const { app } = makeApp({ email: mockEmail() });
    const { res } = await jsonRequest(app, 'POST', '/api/auth/register', { email: 'bad' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/verify-email', () => {
  it('confirms the account, returns a session, and requires a password', async () => {
    const { session } = await registerAndConfirm();
    expect(session.token).toBeTypeOf('string');
    expect(session.user.email).toBe(credentials.email);
    expect(session.user.emailVerifiedAt).toBeTruthy();
    expect(session.user.hasPassword).toBe(false);
    expect(session.mustSetPassword).toBe(true);
  });
});

describe('POST /api/auth/set-password', () => {
  it('saves a password for the authenticated user', async () => {
    const { app, session } = await registerAndConfirm();
    const { res, data } = await jsonRequest(
      app,
      'POST',
      '/api/auth/set-password',
      { password: credentials.password },
      { authorization: `Bearer ${session.token}` },
    );
    expect(res.status).toBe(200);
    expect(data.user.hasPassword).toBe(true);

    const login = await jsonRequest(app, 'POST', '/api/auth/login', credentials);
    expect(login.res.status).toBe(200);
    expect(login.data.mustSetPassword).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in after password is set', async () => {
    const { app, session } = await registerAndConfirm();
    await jsonRequest(
      app,
      'POST',
      '/api/auth/set-password',
      { password: credentials.password },
      { authorization: `Bearer ${session.token}` },
    );
    const { res, data } = await jsonRequest(app, 'POST', '/api/auth/login', credentials);
    expect(res.status).toBe(200);
    expect(data.token).toBeTypeOf('string');
  });

  it('blocks login until the email is confirmed', async () => {
    const email = mockEmail();
    const { app } = makeApp({ email });
    await jsonRequest(app, 'POST', '/api/auth/register', { email: credentials.email });
    const { res } = await jsonRequest(app, 'POST', '/api/auth/login', credentials);
    expect(res.status).toBe(401);
  });

  it('rejects an unknown email', async () => {
    const { app } = makeApp({ email: mockEmail() });
    const { res } = await jsonRequest(app, 'POST', '/api/auth/login', {
      email: 'ghost@nowhere.com',
      password: 'whatever1',
    });
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/auth/me', () => {
  it('updates the display name', async () => {
    const { app, deps } = makeApp({ email: mockEmail() });
    const passwordHash = await hashPassword(credentials.password);
    await deps.users.create({
      email: credentials.email,
      name: 'ash',
      passwordHash,
      emailVerifiedAt: new Date().toISOString(),
    });
    const { data: login } = await jsonRequest(app, 'POST', '/api/auth/login', credentials);
    const { res, data } = await jsonRequest(
      app,
      'PATCH',
      '/api/auth/me',
      { name: 'Ash Ketchum' },
      { authorization: `Bearer ${login.token}` },
    );
    expect(res.status).toBe(200);
    expect(data.user.name).toBe('Ash Ketchum');
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user with a valid token', async () => {
    const { app, session } = await registerAndConfirm();
    const { res, data: me } = await jsonRequest(app, 'GET', '/api/auth/me', undefined, {
      authorization: `Bearer ${session.token}`,
    });
    expect(res.status).toBe(200);
    expect(me.user.email).toBe('ash@pallet.town');
  });

  it('rejects a request without a token', async () => {
    const { app } = makeApp({ email: mockEmail() });
    const { res } = await jsonRequest(app, 'GET', '/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('sends a reset email when the verified account exists', async () => {
    const email = mockEmail();
    const { app, session } = await registerAndConfirm(email);
    await jsonRequest(
      app,
      'POST',
      '/api/auth/set-password',
      { password: credentials.password },
      { authorization: `Bearer ${session.token}` },
    );
    const { res, data } = await jsonRequest(app, 'POST', '/api/auth/forgot-password', {
      email: credentials.email,
    });
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(email.sendPasswordReset).toHaveBeenCalledOnce();
  });
});
