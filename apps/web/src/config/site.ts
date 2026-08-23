import type { ProductCategory } from '@akknerds/shared';

export const SITE = {
  name: 'One More Rip',
  /** Trading / merchant name shown to customers (Sweden / EU ecommerce). */
  legalName: 'One More Rip',
  /**
   * TODO (business): Swedish organisation number (org.nr) and VAT number (momsregistreringsnummer)
   * once confirmed — required for full invoice/legal disclosure. Leave empty until provided.
   */
  organisationNumber: '' as string,
  vatNumber: '' as string,
  tagline: 'Premium Pokémon TCG — sealed boxes, packs & singles',
  description:
    'Your trusted shop for sealed Pokémon TCG booster boxes, Elite Trainer Boxes, packs and graded single cards.',
  email: 'newsletter@onemorerip.cards',
  emailContact: 'contact@onemorerip.cards',
  emailPrivacy: 'privacy@onemorerip.cards',
  emailPartner: 'partner@onemorerip.cards',
  store: {
    street: 'Hallandsvägen 21',
    postalCode: '269 36',
    city: 'Båstad',
    country: 'Sweden',
    /** Single-line address for display */
    line: 'Hallandsvägen 21, 269 36 Båstad, Sweden',
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
  subtitleLines: [
    'New drops, restocks and exclusive bundles',
    'first in your inbox.',
  ] as const,
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
