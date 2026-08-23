import type { ChatContext, ChatLink } from './context.js';

export type ChatIntentId =
  | 'greeting'
  | 'goodbye'
  | 'shipping'
  | 'free_shipping'
  | 'tracking'
  | 'international'
  | 'payments'
  | 'orders'
  | 'cancel_order'
  | 'returns'
  | 'authenticity'
  | 'singles'
  | 'graded'
  | 'shop'
  | 'contact'
  | 'account'
  | 'product_search'
  | 'fallback';

export type ChatMatchKind = 'reply' | 'product_search';

export interface ChatIntent {
  id: ChatIntentId;
  /** Lowercase keywords / phrases; longer phrases score higher. */
  keywords: string[];
  /** Boost for stronger matches (default 1). */
  weight?: number;
  reply?: string | ((ctx: ChatContext) => string);
  suggestions?: string[];
  links?: ChatLink[];
  /** When true, matcher returns product_search with extracted query. */
  productSearch?: boolean;
}

export interface ChatMatchResult {
  intentId: ChatIntentId;
  kind: ChatMatchKind;
  reply: string;
  suggestions: string[];
  links: ChatLink[];
  /** Present when kind is product_search. */
  searchQuery?: string;
}

const STARTER_SUGGESTIONS = [
  'Shipping times',
  'Free shipping?',
  'Returns',
  'Find a card',
  'Contact',
];

export const CHAT_INTENTS: ChatIntent[] = [
  {
    id: 'greeting',
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'yo'],
    weight: 0.8,
    reply: (ctx) =>
      `Hey! Welcome to ${ctx.brandName}. I can help with shipping, returns, payments, authenticity, or finding a card in the shop.`,
    suggestions: STARTER_SUGGESTIONS,
    links: [
      { label: 'Shop', href: '/shop' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    id: 'goodbye',
    keywords: ['bye', 'goodbye', 'thanks', 'thank you', 'cheers', 'that\'s all'],
    weight: 0.7,
    reply: (ctx) =>
      `Anytime — happy ripping! If you need a human, email ${ctx.supportEmail} or use Contact.`,
    suggestions: ['Shop', 'FAQ'],
    links: [
      { label: 'Shop', href: '/shop' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    id: 'free_shipping',
    keywords: [
      'free shipping',
      'free delivery',
      'shipping cost',
      'shipping fee',
      'how much shipping',
    ],
    weight: 1.4,
    reply: (ctx) =>
      `Yes — standard tracked shipping is free on orders over ${ctx.freeShippingLabel}. Below that, a flat shipping fee is shown in your cart and at checkout before you pay.`,
    suggestions: ['Shipping times', 'Track order', 'Shop'],
    links: [
      { label: 'Shipping', href: '/shipping' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    id: 'tracking',
    keywords: ['track', 'tracking', 'where is my order', 'shipment status', 'parcel'],
    weight: 1.3,
    reply:
      'Once dispatched, you will get an email with a tracking link. You can also check the order confirmation page and My orders in your account. Tracking can take a few hours to activate after the label is created.',
    suggestions: ['Shipping times', 'Cancel order', 'Contact'],
    links: [
      { label: 'My account', href: '/account' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    id: 'international',
    keywords: ['international', 'worldwide', 'ship abroad', 'overseas', 'customs', 'duties'],
    weight: 1.3,
    reply:
      'We ship to Sweden, most EU/EEA destinations, and many countries worldwide where carriers allow. International orders may have import duties and taxes paid by the recipient. Sweden typically 2–4 business days after dispatch; EU/EEA 3–7; rest of world usually 5–12. Full details are on Shipping & Delivery.',
    suggestions: ['Shipping times', 'Free shipping?', 'Payments'],
    links: [
      { label: 'Shipping', href: '/shipping' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    id: 'shipping',
    keywords: [
      'shipping',
      'delivery',
      'dispatch',
      'how long',
      'arrive',
      'express',
      'standard shipping',
    ],
    weight: 1.1,
    reply:
      'Orders placed before 14:00 (Europe/Stockholm) on business days are usually dispatched the same day when stock allows. We offer standard tracked parcel delivery. Sweden: typically 2–4 business days after dispatch; EU/EEA: 3–7; rest of world: typically 5–12. See Shipping & Delivery for costs and geography.',
    suggestions: ['Free shipping?', 'Track order', 'International'],
    links: [
      { label: 'Shipping', href: '/shipping' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    id: 'payments',
    keywords: [
      'payment',
      'pay',
      'stripe',
      'credit card',
      'apple pay',
      'google pay',
      'secure checkout',
      'charged',
      'billing',
    ],
    weight: 1.2,
    reply:
      'We accept major cards (Visa, Mastercard, Amex) via Stripe, plus Apple Pay and Google Pay on supported devices. Checkout is PCI Level 1 secure — we never store your full card number. Your card is authorised at checkout and captured when the order is confirmed; pre-orders are charged upfront.',
    suggestions: ['Orders', 'Contact', 'FAQ'],
    links: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Checkout tips', href: '/cart' },
    ],
  },
  {
    id: 'cancel_order',
    keywords: ['cancel', 'change order', 'amend', 'edit address', 'change address'],
    weight: 1.3,
    reply:
      'Contact us ASAP with your order number. Before dispatch we can usually cancel or amend free of charge. After dispatch we cannot change the address in transit — you may still use your 14-day withdrawal right after delivery where it applies. Details: Returns & Refunds.',
    suggestions: ['Returns', 'Track order', 'Contact'],
    links: [
      { label: 'Returns', href: '/returns' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    id: 'orders',
    keywords: [
      'order',
      'confirmation',
      'confirmation email',
      'pre-order',
      'preorder',
      'order went through',
    ],
    weight: 1.1,
    reply:
      'After payment you will see a confirmation screen and receive an email with your order number. Account holders also see orders under My account. Selected sets are available for pre-order — the product page shows the expected ship date, and pre-orders may ship separately from in-stock items.',
    suggestions: ['Cancel order', 'Track order', 'Contact'],
    links: [
      { label: 'My account', href: '/account' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    id: 'returns',
    keywords: ['return', 'refund', 'damaged', 'missing item', 'wrong item', 'not as described'],
    weight: 1.3,
    reply: (ctx) =>
      `EU/Swedish consumers generally have a 14-day right of withdrawal for distance purchases. Unopened sealed product in original condition can be returned within 14 days of delivery. Singles and opened sealed product are typically final sale unless faulty or not as described. Damaged packages: photo the box and product within 48 hours and email ${ctx.supportEmail}. Delayed, lost or misrouted parcels: see Returns & Refunds §7 for who covers supplementary costs.`,
    suggestions: ['Contact', 'Orders', 'Shipping times'],
    links: [
      { label: 'Returns', href: '/returns' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    id: 'authenticity',
    keywords: ['authentic', 'authenticity', 'fake', 'resealed', 'legit', 'genuine'],
    weight: 1.3,
    reply:
      'Every sealed product is sourced from authorised distributors and arrives factory-sealed. We never sell resealed or tampered product. Singles are inspected by our team before listing. Booster boxes and ETBs ship in original factory shrink when the manufacturer provides it.',
    suggestions: ['Singles condition', 'Graded slabs', 'Shop'],
    links: [
      { label: 'Shop', href: '/shop' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    id: 'singles',
    keywords: [
      'single',
      'singles',
      'condition',
      'near mint',
      'lightly played',
      'raw card',
      'card condition',
    ],
    weight: 1.2,
    reply:
      'Singles are graded in-house as Mint, Near Mint, Lightly Played, or Moderately Played — shown on the product page. We aim for Near Mint or better on chase cards unless stated otherwise. Browse the Singles category in the shop and filter by language or condition.',
    suggestions: ['Find a card', 'Graded slabs', 'Shop singles'],
    links: [
      { label: 'Singles', href: '/shop?category=single-card' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    id: 'graded',
    keywords: ['graded', 'slab', 'psa', 'cgc', 'bgs', 'graded slab'],
    weight: 1.3,
    reply:
      'Graded slabs (PSA, CGC, BGS and more) live in their own shop category. Each listing shows the grade and photos of the exact slab you will receive. Ask me to find a card if you have a name or set in mind.',
    suggestions: ['Find a card', 'Shop slabs', 'Authenticity'],
    links: [
      { label: 'Graded Slabs', href: '/shop?category=graded-slab' },
      { label: 'Shop', href: '/shop' },
    ],
  },
  {
    id: 'shop',
    keywords: [
      'shop',
      'browse',
      'catalogue',
      'catalog',
      'booster',
      'etb',
      'elite trainer',
      'category',
      'what do you sell',
    ],
    weight: 1.0,
    reply: (ctx) =>
      `${ctx.brandName} sells sealed booster boxes, Elite Trainer Boxes, packs, single cards, graded slabs, bundles, and accessories. Use Shop by category on the homepage, or filter the shop by series, language, and condition.`,
    suggestions: ['Find a card', 'Singles', 'Graded slabs'],
    links: [
      { label: 'Shop', href: '/shop' },
      { label: 'Booster Boxes', href: '/shop?category=booster-box' },
      { label: 'Singles', href: '/shop?category=single-card' },
    ],
  },
  {
    id: 'contact',
    keywords: ['contact', 'email', 'support', 'help me', 'human', 'speak to'],
    weight: 1.2,
    reply: (ctx) =>
      `Reach us via the Contact page or email ${ctx.supportEmail}. We typically reply within one business day.`,
    suggestions: ['FAQ', 'Orders', 'Returns'],
    links: [
      { label: 'Contact', href: '/contact' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    id: 'account',
    keywords: ['account', 'sign in', 'login', 'register', 'my orders', 'password'],
    weight: 1.1,
    reply:
      'Create an account for faster checkout and order tracking. Sign in from the header, or open My account to view past orders. Guests can still check out with just an email.',
    suggestions: ['Orders', 'Contact', 'Shop'],
    links: [
      { label: 'Sign in', href: '/login' },
      { label: 'My account', href: '/account' },
    ],
  },
  {
    id: 'product_search',
    keywords: [
      'looking for',
      'do you have',
      'have you got',
      'in stock',
      'find',
      'search for',
      'got any',
      'sell',
    ],
    weight: 1.5,
    productSearch: true,
    reply: 'Let me check the catalogue…',
    suggestions: ['Singles', 'Graded slabs', 'Shop'],
    links: [{ label: 'Shop', href: '/shop' }],
  },
];

export const FALLBACK_INTENT: ChatIntent = {
  id: 'fallback',
  keywords: [],
  reply: (ctx) =>
    `I am not sure about that one. Try asking about shipping, returns, payments, or a card name — or browse the FAQ / Contact ${ctx.supportEmail}.`,
  suggestions: STARTER_SUGGESTIONS,
  links: [
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' },
    { label: 'Shop', href: '/shop' },
  ],
};

export const CHAT_STARTER_CHIPS = STARTER_SUGGESTIONS;
