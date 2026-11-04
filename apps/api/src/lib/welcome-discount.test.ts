import { describe, expect, it } from 'vitest';
import { hashPassword } from './password.js';
import { clearWelcomeDiscountAfterPurchase } from './welcome-discount.js';
import { createMemoryRepositories } from '../repositories/factory.js';
import { loadEnv } from '../env.js';
import { EmailService } from './email.js';
import { PaymentService } from './payments.js';
import { StorageService } from './storage.js';
import { MemoryRateLimiter } from '@akknerds/rate-limit';
import type { AppDeps } from '../context.js';

function makeDeps(): AppDeps {
  const env = loadEnv();
  const repos = createMemoryRepositories();
  return {
    env,
    ...repos,
    payments: new PaymentService(env),
    storage: new StorageService(env.storage),
    email: new EmailService(env),
    rateLimiter: new MemoryRateLimiter(),
  };
}

describe('clearWelcomeDiscountAfterPurchase', () => {
  it('deactivates a personal admin code and clears the profile', async () => {
    const deps = makeDeps();
    const user = await deps.users.create({
      email: 'emelie@example.com',
      name: 'Emelie',
      passwordHash: await hashPassword('customerpass123'),
      emailVerifiedAt: new Date().toISOString(),
    });
    const discount = await deps.discounts.create({
      code: 'THANKYOU5',
      label: '5% thank-you',
      kind: 'percent',
      value: 5,
      allowedEmail: user.email,
      allowedUserId: user.id,
    });
    await deps.users.updateProfile(user.id, { discountCode: 'THANKYOU5' });

    await clearWelcomeDiscountAfterPurchase(deps, user.id);

    const refreshed = await deps.users.findById(user.id);
    expect(refreshed?.profile.discountCode).toBeNull();
    const stored = await deps.discounts.findByCode('THANKYOU5');
    expect(stored?.active).toBe(false);
    expect(stored?.id).toBe(discount.id);
    expect(await deps.discounts.findActiveDef('THANKYOU5')).toBeUndefined();
  });

  it('clears welcome code from profile without touching built-ins', async () => {
    const deps = makeDeps();
    const user = await deps.users.create({
      email: 'new@example.com',
      name: 'New',
      passwordHash: await hashPassword('customerpass123'),
      emailVerifiedAt: new Date().toISOString(),
    });
    expect(user.profile.discountCode).toBe('ONEMORERIP10');

    await clearWelcomeDiscountAfterPurchase(deps, user.id);

    const refreshed = await deps.users.findById(user.id);
    expect(refreshed?.profile.discountCode).toBeNull();
  });
});
