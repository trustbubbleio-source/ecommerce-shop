import type { OrderStatus } from '@akknerds/shared';
import { findDiscountCode, shouldClearDiscountAfterPurchase } from '@akknerds/shared';
import type { AppDeps } from '../context.js';
import { resolveDiscountDef } from './resolve-discount.js';

const COMPLETED: ReadonlySet<OrderStatus> = new Set(['paid', 'fulfilled']);

export async function userHasCompletedOrder(deps: AppDeps, userId: string): Promise<boolean> {
  const orders = await deps.orders.listByUser(userId);
  return orders.some((order) => COMPLETED.has(order.status));
}

/**
 * After a paid order: drop clear-after-purchase codes from the profile, and
 * deactivate admin/DB personal codes so they cannot be saved or used again.
 * Built-in codes (welcome, RIP5, …) stay in the shared catalogue.
 */
export async function clearWelcomeDiscountAfterPurchase(
  deps: AppDeps,
  userId: string | undefined,
): Promise<void> {
  if (!userId) return;
  const user = await deps.users.findById(userId);
  const code = user?.profile.discountCode;
  if (!user || !code) return;

  const def = await resolveDiscountDef(deps, code);
  if (!def || !shouldClearDiscountAfterPurchase(def)) return;

  // Personal/admin codes: turn off so re-entering the code fails.
  if (!findDiscountCode(code)) {
    const stored = await deps.discounts.findByCode(code);
    if (stored?.active) {
      await deps.discounts.setActive(stored.id, false);
    }
  }

  await deps.users.updateProfile(userId, { discountCode: null });
}
