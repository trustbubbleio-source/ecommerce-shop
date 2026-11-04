import { describe, expect, it } from 'vitest';
import { hashPassword } from '../lib/password.js';
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

async function loginAdmin(app: ReturnType<typeof makeApp>['app']) {
  const { data } = await jsonRequest(app, 'POST', '/api/auth/login', {
    email: adminCreds.email,
    password: adminCreds.password,
  });
  return data.token as string;
}

describe('admin discounts', () => {
  it('creates a personal thank-you code and assigns it to the user', async () => {
    const { app, deps } = makeApp();
    await seedAdmin(deps);
    const token = await loginAdmin(app);
    const customer = await deps.users.create({
      email: 'emelie@example.com',
      name: 'Emelie',
      passwordHash: await hashPassword('customerpass123'),
      emailVerifiedAt: new Date().toISOString(),
    });

    const { res, data } = await jsonRequest(
      app,
      'POST',
      '/api/admin/discounts',
      {
        code: 'THANKYOU5',
        label: '5% thank-you',
        kind: 'percent',
        value: 5,
        allowedUserId: customer.id,
        assignToUser: true,
      },
      { authorization: `Bearer ${token}` },
    );

    expect(res.status).toBe(201);
    expect(data.discount.code).toBe('THANKYOU5');
    expect(data.discount.allowedEmail).toBe('emelie@example.com');
    expect(data.assigned).toBe(true);

    const refreshed = await deps.users.findById(customer.id);
    expect(refreshed?.profile.discountCode).toBe('THANKYOU5');

    const list = await jsonRequest(app, 'GET', '/api/admin/discounts', undefined, {
      authorization: `Bearer ${token}`,
    });
    expect(list.data.custom.some((row: { code: string }) => row.code === 'THANKYOU5')).toBe(true);
  });

  it('rejects built-in code names', async () => {
    const { app, deps } = makeApp();
    await seedAdmin(deps);
    const token = await loginAdmin(app);

    const { res } = await jsonRequest(
      app,
      'POST',
      '/api/admin/discounts',
      {
        code: 'RIP5',
        label: 'Nope',
        kind: 'fixed',
        value: 500,
      },
      { authorization: `Bearer ${token}` },
    );
    expect(res.status).toBe(409);
  });
});
