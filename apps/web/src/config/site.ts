import type { ProductCategory } from '@akknerds/shared';

export const SITE = {
  name: 'akkNERDS',
  tagline: 'Premium Pokémon TCG — sealed boxes, packs & singles',
  description:
    'Your trusted shop for sealed Pokémon TCG booster boxes, Elite Trainer Boxes, packs and graded single cards.',
  email: 'hello@akknerds.shop',
  social: {
    instagram: 'https://instagram.com',
    twitter: 'https://x.com',
    discord: 'https://discord.com',
  },
} as const;

export interface NavLink {
  label: string;
  to: string;
}

export const MAIN_NAV: NavLink[] = [
  { label: 'Shop', to: '/shop' },
  { label: 'Booster Boxes', to: '/shop?category=booster-box' },
  { label: 'Singles', to: '/shop?category=single-card' },
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
  { category: 'single-card', label: 'Single Cards', blurb: 'Chase cards & graded gems' },
  { category: 'bundle', label: 'Bundles', blurb: 'Curated value sets' },
  { category: 'accessory', label: 'Accessories', blurb: 'Sleeves, binders & toploaders' },
];
