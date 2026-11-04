import {
  canUserUseDiscount,
  findDiscountCode,
  isManualDiscountAllowed,
  type DiscountCodeDef,
} from '@akknerds/shared';
import type { AppDeps } from '../context.js';

/** Built-in catalogue first, then active admin/DB codes. */
export async function resolveDiscountDef(
  deps: AppDeps,
  code: string | null | undefined,
): Promise<DiscountCodeDef | undefined> {
  if (!code) return undefined;
  const builtin = findDiscountCode(code);
  if (builtin) return builtin;
  return deps.discounts.findActiveDef(code);
}

export async function assertDiscountSavable(
  deps: AppDeps,
  code: string,
  user: { id: string; email: string },
): Promise<{ ok: true; def: DiscountCodeDef } | { ok: false; error: string; status: 400 }> {
  const def = await resolveDiscountDef(deps, code);
  if (!def) {
    return { ok: false, error: 'That discount code is not valid.', status: 400 };
  }
  if (!isManualDiscountAllowed(def)) {
    return {
      ok: false,
      error: 'That welcome offer is applied automatically for new accounts only.',
      status: 400,
    };
  }
  if (!canUserUseDiscount(def, { userId: user.id, userEmail: user.email })) {
    return {
      ok: false,
      error: 'That discount code is not available on this account.',
      status: 400,
    };
  }
  return { ok: true, def };
}
