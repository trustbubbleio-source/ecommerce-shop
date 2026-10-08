import { PURCHASES_LOCKED_UNTIL_LAUNCH } from '@akknerds/shared';
import { useAuthStore } from '../store/auth';

/**
 * Temporary pre-launch gate (remove or set `PURCHASES_LOCKED_UNTIL_LAUNCH` false on Oct 31).
 * Unit tests skip the shopping gate so cart flows keep working.
 * Admins can still purchase while the public sees the Oct 31 lock.
 */
export const PRELAUNCH = {
  active: PURCHASES_LOCKED_UNTIL_LAUNCH,
  badgeLabel: 'Available Oct 31',
  buttonLabel: 'Available Oct 31',
  /** Compact label for narrow product cards / mobile. */
  buttonLabelShort: 'Oct 31',
  description: 'Purchases open October 31, 2026.',
  homeEyebrow: 'Physical store',
  homeEyebrow2: 'Webshop',
  homeTitle: 'We go live October 31',
  homeBody:
    'One More Rip opens its online shop and physical store on October 31, 2026. Browse the catalogue now, purchases unlock on launch day.',
  /** S3/CloudFront object key for the storefront photo on the home announcement. */
  storeImage: 'storeImageFront.png',
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
