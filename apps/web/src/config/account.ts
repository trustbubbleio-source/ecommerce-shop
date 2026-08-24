/** Logged-in account navigation shared by the header menu and mobile nav. */
export const ACCOUNT_NAV = [
  { label: 'Profile', to: '/account' },
  { label: 'Orders', to: '/account/orders' },
  { label: 'Settings', to: '/account/settings' },
] as const;
