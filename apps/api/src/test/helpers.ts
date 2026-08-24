import { type CreatedApp, createApp } from '../app.js';
import { type Env, loadEnv } from '../env.js';
import type { AppDeps } from '../context.js';
import { hashPassword } from '../lib/password.js';

/** A deterministic test env (mock payments, fixed JWT secret). */
export function testEnv(overrides: Partial<NodeJS.ProcessEnv> = {}): Env {
  return loadEnv({
    PORT: '4000',
    WEB_ORIGIN: 'http://localhost:5173',
    JWT_SECRET: 'test-secret',
    ...overrides,
  });
}

export function makeApp(overrides: Partial<AppDeps> = {}): CreatedApp {
  return createApp({ env: overrides.env ?? testEnv(), ...overrides });
}

/** Convenience JSON request against a Hono app. */
export async function jsonRequest(
  app: CreatedApp['app'],
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
) {
  const res = await app.request(path, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { res, data };
}

/** Create a verified user and return a session token. */
export async function registerAndLogin(
  created: CreatedApp,
  email = 'trainer@pallet.town',
  password = 'pikachu123',
) {
  const passwordHash = await hashPassword(password);
  await created.deps.users.create({
    name: 'Ash Ketchum',
    email,
    passwordHash,
    emailVerifiedAt: new Date().toISOString(),
  });
  const { data } = await jsonRequest(created.app, 'POST', '/api/auth/login', {
    email,
    password,
  });
  return data.token as string;
}
