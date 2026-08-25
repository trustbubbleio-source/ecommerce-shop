import { slugify } from './format.js';
import type { CardCondition, CardRarity, Product, ProductCategory, ProductSeries, ProductSet } from './types.js';

interface ProductSeed {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  set: ProductSet;
  series: ProductSeries;
  price: number;
  compareAtPrice?: number;
  accent: string;
  stock?: number;
  featured?: boolean;
  isNew?: boolean;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  rarity?: CardRarity;
  condition?: CardCondition;
  cardNumber?: string;
  artist?: string;
  releaseDate: string;
}

function defineProduct(seed: ProductSeed): Product {
  return {
    currency: 'eur',
    stock: 25,
    featured: false,
    isNew: false,
    rating: 4.6,
    reviewCount: 42,
    tags: [],
    images: [],
    language: 'english',
    ...seed,
    slug: slugify(`${seed.name}-${seed.id}`),
  };
}

/**
 * The authoritative product catalog. In a production deployment this would be
 * backed by a database; the API repository layer reads from here so swapping in
 * Postgres/Prisma only touches one module.
 */
export const PRODUCTS: Product[] = [
  // ── Booster Boxes ──────────────────────────────────────────────
  defineProduct({
    id: 'bb-151',
    name: 'Pokémon 151 Booster Box',
    description:
      'Relive the original 151 with this 36-pack booster box. Chase Kanto favorites in dazzling Illustration Rares and ex cards. Sealed, factory-fresh stock.',
    category: 'booster-box',
    set: '151',
    series: 'Scarlet & Violet',
    price: 16999,
    compareAtPrice: 18999,
    accent: '#ef4444',
    stock: 18,
    featured: true,
    isNew: true,
    rating: 4.9,
    reviewCount: 312,
    tags: ['kanto', 'sealed', 'best-seller'],
    releaseDate: '2023-09-22',
  }),
  defineProduct({
    id: 'bb-obsidian-flames',
    name: 'Obsidian Flames Booster Box',
    description:
      'Charizard ex headlines Obsidian Flames. 36 packs of Tera-type firepower with Terastal ex chase cards. Perfect for collectors and competitive players.',
    category: 'booster-box',
    set: 'Obsidian Flames',
    series: 'Scarlet & Violet',
    price: 13999,
    accent: '#f97316',
    stock: 22,
    featured: true,
    rating: 4.8,
    reviewCount: 188,
    tags: ['charizard', 'sealed'],
    releaseDate: '2023-08-11',
  }),
  defineProduct({
    id: 'bb-paldea-evolved',
    name: 'Paldea Evolved Booster Box',
    description:
      'Explore the Paldea region with 36 packs. Features powerful ex cards and the debut of new mechanics from the Scarlet & Violet era.',
    category: 'booster-box',
    set: 'Paldea Evolved',
    series: 'Scarlet & Violet',
    price: 12999,
    accent: '#22c55e',
    stock: 16,
    rating: 4.7,
    reviewCount: 96,
    tags: ['paldea', 'sealed'],
    releaseDate: '2023-06-09',
  }),
  defineProduct({
    id: 'bb-temporal-forces',
    name: 'Temporal Forces Booster Box',
    description:
      'Past and future collide. 36 packs featuring Ancient and Future Pokémon ex, plus stunning Special Illustration Rares.',
    category: 'booster-box',
    set: 'Temporal Forces',
    series: 'Scarlet & Violet',
    price: 14499,
    accent: '#6366f1',
    stock: 20,
    isNew: true,
    rating: 4.8,
    reviewCount: 74,
    tags: ['sealed', 'new'],
    releaseDate: '2024-03-22',
  }),
  defineProduct({
    id: 'bb-lost-origin',
    name: 'Lost Origin Booster Box',
    description:
      'Enter the Lost Zone. 36 packs of Sword & Shield era cards featuring Giratina VSTAR and the fan-favorite Trainer Gallery.',
    category: 'booster-box',
    set: 'Lost Origin',
    series: 'Sword & Shield',
    price: 15999,
    compareAtPrice: 17499,
    accent: '#a855f7',
    stock: 9,
    rating: 4.9,
    reviewCount: 210,
    tags: ['giratina', 'sealed', 'vintage'],
    releaseDate: '2022-09-09',
  }),

  // ── Elite Trainer Boxes ────────────────────────────────────────
  defineProduct({
    id: 'etb-151',
    name: 'Pokémon 151 Elite Trainer Box',
    description:
      'Everything you need to play: 9 booster packs, 65 card sleeves featuring Snorlax, dice, status markers and a collector box. A must-have for 151 fans.',
    category: 'elite-trainer-box',
    set: '151',
    series: 'Scarlet & Violet',
    price: 5499,
    accent: '#ef4444',
    stock: 30,
    featured: true,
    isNew: true,
    rating: 4.9,
    reviewCount: 421,
    tags: ['kanto', 'etb', 'best-seller'],
    releaseDate: '2023-09-22',
  }),
  defineProduct({
    id: 'etb-paradox-rift',
    name: 'Paradox Rift Elite Trainer Box',
    description:
      '9 booster packs plus premium accessories. Dive into the paradox of ancient and future Pokémon with this collector-grade ETB.',
    category: 'elite-trainer-box',
    set: 'Paradox Rift',
    series: 'Scarlet & Violet',
    price: 4999,
    accent: '#14b8a6',
    stock: 27,
    rating: 4.7,
    reviewCount: 134,
    tags: ['etb'],
    releaseDate: '2023-11-03',
  }),
  defineProduct({
    id: 'etb-twilight-masquerade',
    name: 'Twilight Masquerade Elite Trainer Box',
    description:
      'Unmask the mystery of Kitakami. 9 packs, exclusive sleeves and accessories themed around the latest masked legends.',
    category: 'elite-trainer-box',
    set: 'Twilight Masquerade',
    series: 'Scarlet & Violet',
    price: 5199,
    accent: '#8b5cf6',
    stock: 24,
    isNew: true,
    rating: 4.8,
    reviewCount: 58,
    tags: ['etb', 'new'],
    releaseDate: '2024-05-24',
  }),

  // ── Booster Packs ──────────────────────────────────────────────
  defineProduct({
    id: 'bp-151',
    name: 'Pokémon 151 Booster Pack',
    description:
      'A single 10-card booster pack from the 151 set. Will you pull the Charizard ex Special Illustration Rare?',
    category: 'booster-pack',
    set: '151',
    series: 'Scarlet & Violet',
    price: 599,
    accent: '#ef4444',
    stock: 120,
    featured: true,
    rating: 4.6,
    reviewCount: 540,
    tags: ['single-pack', 'kanto'],
    releaseDate: '2023-09-22',
  }),
  defineProduct({
    id: 'bp-obsidian-flames',
    name: 'Obsidian Flames Booster Pack',
    description: 'One 10-card pack from Obsidian Flames. Chase the Charizard ex and Tera Pokémon.',
    category: 'booster-pack',
    set: 'Obsidian Flames',
    series: 'Scarlet & Violet',
    price: 449,
    accent: '#f97316',
    stock: 150,
    rating: 4.5,
    reviewCount: 287,
    tags: ['single-pack'],
    releaseDate: '2023-08-11',
  }),
  defineProduct({
    id: 'bp-temporal-forces',
    name: 'Temporal Forces Booster Pack',
    description: 'A single pack from Temporal Forces. Ancient and Future Pokémon await.',
    category: 'booster-pack',
    set: 'Temporal Forces',
    series: 'Scarlet & Violet',
    price: 479,
    accent: '#6366f1',
    stock: 140,
    isNew: true,
    rating: 4.6,
    reviewCount: 61,
    tags: ['single-pack', 'new'],
    releaseDate: '2024-03-22',
  }),

  // ── Single Cards ───────────────────────────────────────────────
  defineProduct({
    id: 'sc-charizard-ex-151',
    name: 'Charizard ex — 151 (Special Illustration Rare)',
    description:
      'The crown jewel of the 151 set. Charizard ex Special Illustration Rare #199, graded Near Mint. A centerpiece for any collection.',
    category: 'single-card',
    set: '151',
    series: 'Scarlet & Violet',
    price: 8999,
    compareAtPrice: 10999,
    accent: '#f97316',
    stock: 4,
    featured: true,
    rating: 5,
    reviewCount: 33,
    rarity: 'illustration-rare',
    condition: 'near-mint',
    cardNumber: '199/165',
    tags: ['charizard', 'chase', 'graded'],
    releaseDate: '2023-09-22',
  }),
  defineProduct({
    id: 'sc-mewtwo-ex-151',
    name: 'Mewtwo ex — 151 (Ultra Rare)',
    description:
      'Mewtwo ex Ultra Rare from the 151 set. Psychic powerhouse in pristine Near Mint condition.',
    category: 'single-card',
    set: '151',
    series: 'Scarlet & Violet',
    price: 1899,
    accent: '#a855f7',
    stock: 12,
    rating: 4.8,
    reviewCount: 27,
    rarity: 'ultra-rare',
    condition: 'near-mint',
    cardNumber: '183/165',
    tags: ['mewtwo', 'psychic'],
    releaseDate: '2023-09-22',
  }),
  defineProduct({
    id: 'sc-pikachu-ir-151',
    name: 'Pikachu — 151 (Illustration Rare)',
    description:
      'The beloved Pikachu Illustration Rare from the 151 set. A gorgeous full-art collector favorite.',
    category: 'single-card',
    set: '151',
    series: 'Scarlet & Violet',
    price: 2499,
    accent: '#eab308',
    stock: 8,
    featured: true,
    rating: 4.9,
    reviewCount: 64,
    rarity: 'illustration-rare',
    condition: 'mint',
    cardNumber: '173/165',
    tags: ['pikachu', 'chase'],
    releaseDate: '2023-09-22',
  }),
  defineProduct({
    id: 'sc-gardevoir-ex',
    name: 'Gardevoir ex — Scarlet & Violet Base (Ultra Rare)',
    description:
      'A staple of competitive play. Gardevoir ex Ultra Rare, Near Mint, ready for your deck or binder.',
    category: 'single-card',
    set: 'Scarlet & Violet Base',
    series: 'Scarlet & Violet',
    price: 1299,
    accent: '#ec4899',
    stock: 15,
    rating: 4.7,
    reviewCount: 41,
    rarity: 'ultra-rare',
    condition: 'near-mint',
    cardNumber: '086/198',
    tags: ['competitive', 'meta'],
    releaseDate: '2023-03-31',
  }),
  defineProduct({
    id: 'sc-giratina-vstar',
    name: 'Giratina VSTAR — Lost Origin (Secret Rare)',
    description:
      'Giratina VSTAR gold Secret Rare from Lost Origin. A coveted Lost Zone icon in collector-grade condition.',
    category: 'single-card',
    set: 'Lost Origin',
    series: 'Sword & Shield',
    price: 5499,
    accent: '#a855f7',
    stock: 3,
    rating: 5,
    reviewCount: 19,
    rarity: 'secret-rare',
    condition: 'mint',
    cardNumber: '201/196',
    tags: ['giratina', 'gold', 'chase'],
    releaseDate: '2022-09-09',
  }),

  // ── Bundles ────────────────────────────────────────────────────
  defineProduct({
    id: 'bundle-starter',
    name: 'Trainer Starter Bundle',
    description:
      'New to the hobby? This bundle pairs a 151 Elite Trainer Box with 5 assorted booster packs, premium sleeves and a deck box. Everything to start collecting and playing.',
    category: 'bundle',
    set: 'Mixed',
    series: 'One More Rip Exclusive',
    price: 7999,
    compareAtPrice: 9499,
    accent: '#8b5cf6',
    stock: 14,
    featured: true,
    isNew: true,
    rating: 4.8,
    reviewCount: 52,
    tags: ['bundle', 'value', 'gift'],
    releaseDate: '2024-01-15',
  }),
  defineProduct({
    id: 'bundle-collector',
    name: 'Collector Vault Bundle',
    description:
      'For the serious collector: two booster boxes (151 + Obsidian Flames), a premium binder, and 100 ultra-clear sleeves. Save big versus buying separately.',
    category: 'bundle',
    set: 'Mixed',
    series: 'One More Rip Exclusive',
    price: 28999,
    compareAtPrice: 32999,
    accent: '#6366f1',
    stock: 6,
    rating: 4.9,
    reviewCount: 28,
    tags: ['bundle', 'premium', 'value'],
    releaseDate: '2024-01-15',
  }),

  // ── Accessories ────────────────────────────────────────────────
  defineProduct({
    id: 'acc-sleeves-snorlax',
    name: 'Snorlax Card Sleeves (65 ct)',
    description:
      'Protect your collection in style. 65 official Snorlax-themed sleeves, perfectly sized for standard Pokémon cards.',
    category: 'accessory',
    set: 'Accessories',
    series: 'Protection',
    price: 799,
    accent: '#3b82f6',
    stock: 80,
    rating: 4.7,
    reviewCount: 96,
    tags: ['sleeves', 'protection'],
    releaseDate: '2023-09-22',
  }),
  defineProduct({
    id: 'acc-binder-pro',
    name: 'One More Rip Pro Collector Binder (480 ct)',
    description:
      'A 9-pocket zip binder holding up to 480 cards. Side-loading pockets, acid-free pages and a rugged purple shell with the One More Rip crest.',
    category: 'accessory',
    set: 'Accessories',
    series: 'Protection',
    price: 2999,
    accent: '#8b5cf6',
    stock: 45,
    featured: true,
    rating: 4.8,
    reviewCount: 71,
    tags: ['binder', 'storage', 'premium'],
    releaseDate: '2024-01-15',
  }),
  defineProduct({
    id: 'acc-toploaders',
    name: 'Premium Toploaders (25 ct)',
    description:
      '25 rigid, crystal-clear toploaders for your most valuable singles. UV-resistant and snug for graded-ready protection.',
    category: 'accessory',
    set: 'Accessories',
    series: 'Protection',
    price: 999,
    accent: '#06b6d4',
    stock: 100,
    rating: 4.6,
    reviewCount: 58,
    tags: ['toploaders', 'protection'],
    releaseDate: '2023-06-01',
  }),
];

const BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));
const BY_SLUG = new Map(PRODUCTS.map((p) => [p.slug, p]));

export function getProductById(id: string): Product | undefined {
  return BY_ID.get(id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return BY_SLUG.get(slug);
}

export { PRODUCT_CATEGORIES, PRODUCT_SERIES, PRODUCT_SETS } from './enums.js';
