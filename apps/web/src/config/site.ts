import type { ProductCategory } from '@akknerds/shared';

export const SITE = {
  name: 'One More Rip',
  /** Trading / merchant name shown to customers (Sweden / EU ecommerce). */
  legalName: 'One More Rip',
  /** Swedish legal form (enskild firma). */
  legalForm: 'Sole proprietorship',
  /** Swedish organisationsnummer (personnummer-based for enskild firma). Shown on Terms, not in the main Contact header. */
  organisationNumber: '920108-4937',
  /** Swedish VAT / momsregistreringsnummer. Shown on Terms; Contact only inside collapsed Business information. */
  vatNumber: 'SE920108493701',
  tagline: 'Premium Pokémon TCG — sealed boxes, packs & singles',
  description:
    'Your trusted shop for sealed Pokémon TCG booster boxes, Elite Trainer Boxes, packs and graded single cards.',
  /**
   * Purpose-specific mailboxes. Prefer these over a single inbox in customer-facing copy.
   * Keep newsletter@ for list mail if you use it; create aliases that do not yet exist in DNS/hosting.
   */
  email: {
    newsletter: 'newsletter@onemorerip.cards',
    contact: 'contact@onemorerip.cards',
    support: 'support@onemorerip.cards',
    orders: 'orders@onemorerip.cards',
    billing: 'billing@onemorerip.cards',
    returns: 'returns@onemorerip.cards',
    privacy: 'privacy@onemorerip.cards',
    partner: 'partner@onemorerip.cards',
    trade: 'trade@onemorerip.cards',
  },
  store: {
    street: 'Hallandsvägen 21',
    postalCode: '269 36',
    city: 'Båstad',
    country: 'Sweden',
    /** Single-line address for display */
    line: 'Hallandsvägen 21, 269 36 Båstad, Sweden',
    /** Approx. pin for Contact map (Hallandsvägen / Malen, Båstad). */
    lat: 56.4294,
    lng: 12.8478,
  },
  /** Public support hours for customer service. */
  supportHours: 'Monday–Friday, typically within one business day',
  social: {
    instagram: 'https://www.instagram.com/onemorerip.cards',
    tiktok: 'https://www.tiktok.com/@onemorerip.cards',
    facebook: 'https://www.facebook.com/onemorerip.cards',
    discord: 'https://discord.gg/onemorerip',
  },
  socialHandles: {
    instagram: '@onemorerip.cards',
    tiktok: '@onemorerip.cards',
    facebook: 'One More Rip',
    discord: 'One More Rip',
  },
} as const;

/** Shared copy for newsletter subscribe (home banner + footer). */
export const NEWSLETTER = {
  title: 'Never miss a drop',
  subtitleLines: ['New drops, restocks and exclusive bundles', 'first in your inbox.'] as const,
  cta: 'Subscribe',
  placeholder: 'you@email.com',
  successTitle: "You're on the list",
  successDescription: 'Watch your inbox for drops and restocks.',
} as const;

export interface NavLink {
  label: string;
  to: string;
}

export const MAIN_NAV: NavLink[] = [
  { label: 'Shop', to: '/shop' },
  { label: 'Booster Boxes', to: '/shop?category=booster-box' },
  { label: 'Singles', to: '/shop?category=single-card' },
  { label: 'Graded Slabs', to: '/shop?category=graded-slab' },
  { label: 'Blog', to: '/blog' },
  { label: 'Socials', to: '/socials' },
  { label: 'Contact', to: '/contact' },
];

export interface CategoryTile {
  category: ProductCategory;
  label: string;
  blurb: string;
}

export const CATEGORY_TILES: CategoryTile[] = [
  { category: 'booster-box', label: 'Booster Boxes', blurb: '36 packs of pure chase potential' },
  {
    category: 'elite-trainer-box',
    label: 'Elite Trainer Boxes',
    blurb: 'Play-ready with accessories',
  },
  { category: 'booster-pack', label: 'Booster Packs', blurb: 'Single packs, instant rips' },
  { category: 'single-card', label: 'Single Cards', blurb: 'Chase cards & raw singles' },
  { category: 'graded-slab', label: 'Graded Slabs', blurb: 'PSA, CGC & BGS certified gems' },
  { category: 'bundle', label: 'Bundles', blurb: 'Curated value sets' },
  { category: 'accessory', label: 'Accessories', blurb: 'Sleeves, binders & toploaders' },
];
