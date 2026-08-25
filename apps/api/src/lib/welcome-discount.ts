import type { OrderStatus } from '@akknerds/shared';
import { isWelcomeDiscountCode } from '@akknerds/shared';
import type { AppDeps } from '../context.js';

const COMPLETED: ReadonlySet<OrderStatus> = new Set(['paid', 'fulfilled']);

export async function userHasCompletedOrder(deps: AppDeps, userId: string): Promise<boolean> {
  const orders = await deps.orders.listByUser(userId);
  return orders.some((order) => COMPLETED.has(order.status));
}

/** Drop the signup welcome offer after the member's first completed purchase. */
export async function clearWelcomeDiscountAfterPurchase(
  deps: AppDeps,
  userId: string | undefined,
): Promise<void> {
  if (!userId) return;
  const user = await deps.users.findById(userId);
  if (!user || !isWelcomeDiscountCode(user.profile.discountCode)) return;
  await deps.users.updateProfile(userId, { discountCode: null });
}
