import { PURCHASES_LOCKED_UNTIL_LAUNCH } from '@akknerds/shared';
import { useAuthStore } from '../store/auth';

/**
 * Pre-launch purchase gate. Off now that the shop is live —
 * keep labels for any leftover UI that still reads PRELAUNCH while locked.
 * Unit tests skip the shopping gate so cart flows keep working.
 */
export const PRELAUNCH = {
  active: PURCHASES_LOCKED_UNTIL_LAUNCH,
  badgeLabel: 'Available Oct 31',
  buttonLabel: 'Available Oct 31',
  /** Compact label for narrow product cards / mobile. */
  buttonLabelShort: 'Oct 31',
  description: 'Purchases are open.',
  homeEyebrow: 'Physical store',
  homeEyebrow2: 'Open now',
  homeTitle: "We're open",
  homeBody:
    'One More Rip is open to the public — online and in our Båstad store. Come rip packs, browse sealed product, and pick up in person.',
} as const;

export function isPrelaunchActive(): boolean {
  if (import.meta.env.MODE === 'test') return false;
  return PRELAUNCH.active;
}

/** Public shoppers are locked during prelaunch; admins can still buy. */
export function isPurchaseLocked(isAdmin: boolean, prelaunch = isPrelaunchActive()): boolean {
  return prelaunch && !isAdmin;
}

export function usePurchaseLocked(): boolean {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  return isPurchaseLocked(isAdmin);
}
