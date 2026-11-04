import type { OrderStatus } from '@akknerds/shared';
import { shouldClearDiscountAfterPurchase } from '@akknerds/shared';
import type { AppDeps } from '../context.js';
import { resolveDiscountDef } from './resolve-discount.js';

const COMPLETED: ReadonlySet<OrderStatus> = new Set(['paid', 'fulfilled']);

export async function userHasCompletedOrder(deps: AppDeps, userId: string): Promise<boolean> {
  const orders = await deps.orders.listByUser(userId);
  return orders.some((order) => COMPLETED.has(order.status));
}

/**
 * Clear profile-saved promos after a paid order when the definition says so
 * (welcome offer, personal thank-you codes, etc.).
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
  await deps.users.updateProfile(userId, { discountCode: null });
}
