import { PURCHASES_LOCKED_UNTIL_LAUNCH } from '@akknerds/shared';

/** Public checkout stays closed until launch; admins can still pay. Tests skip the lock. */
export function canPurchase(
  role: string | undefined,
  opts: { locked?: boolean; isTest?: boolean } = {},
): boolean {
  const locked = opts.locked ?? PURCHASES_LOCKED_UNTIL_LAUNCH;
  const isTest = opts.isTest ?? process.env.NODE_ENV === 'test';
  if (!locked || isTest) return true;
  return role === 'admin';
}
