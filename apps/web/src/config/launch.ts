/**
 * Temporary pre-launch gate (remove or set `active: false` on Oct 15).
 * Unit tests skip the shopping gate so cart flows keep working.
 */
export const PRELAUNCH = {
  active: true,
  badgeLabel: 'Available Oct 15',
  buttonLabel: 'Available Oct 15',
  description: 'Purchases open October 15, 2026.',
  homeEyebrow: 'Opening soon',
  homeTitle: 'We go live October 15',
  homeBody:
    'One More Rip opens its online shop and physical store on October 15, 2026. Browse the catalogue now — purchases unlock on launch day.',
} as const;

export function isPrelaunchActive(): boolean {
  if (import.meta.env.MODE === 'test') return false;
  return PRELAUNCH.active;
}
