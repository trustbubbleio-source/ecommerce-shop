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
  | 'discount'
  | 'membership'
  | 'trade'
  | 'partners'
  | 'privacy'
  | 'cookies'
  | 'terms'
  | 'store'
  | 'artist'
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
  'Welcome offer',
  'Contact',
];

export const CHAT_INTENTS: ChatIntent[] = [
  {
    id: 'greeting',
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'yo'],
    weight: 0.8,
    reply: (ctx) =>
      `Hey! Welcome to ${ctx.brandName}. I can help with shipping, returns, your account, welcome discounts, trade/partners, store info, or finding a card.`,
    suggestions: STARTER_SUGGESTIONS,
    links: [
      { label: 'Buy', href: '/shop' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    id: 'goodbye',
    keywords: ['bye', 'goodbye', 'thanks', 'thank you', 'cheers', "that's all"],
    weight: 0.7,
    reply: (ctx) =>
      `Anytime — happy ripping! If you need a human, email ${ctx.supportEmail} or use Contact.`,
    suggestions: ['Buy', 'FAQ'],
    links: [
      { label: 'Buy', href: '/shop' },
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
      `Yes — standard tracked shipping is free on orders over ${ctx.freeShippingLabel}. Below that, a flat shipping fee is shown in your cart and at checkout before you pay. You can switch EUR/SEK in the header.`,
    suggestions: ['Shipping times', 'Track order', 'Buy'],
    links: [
      { label: 'Shipping', href: '/shipping' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    id: 'tracking',
    keywords: ['track', 'tracking', 'where is my order', 'shipment status', 'parcel'],
    weight: 1.3,
    reply: (ctx) =>
      `Every paid order can be followed in My orders. Carrier tracking (name and URL) is included on orders of ${ctx.freeShippingLabel} or more, and appears when the parcel is collected. Below that, there is no carrier tracking number — the order page on this site is the live status. Order help: ${ctx.ordersEmail}.`,
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
      'Orders placed before 14:00 (Europe/Stockholm) on business days are usually dispatched the same day when stock allows. Sweden: typically 2–4 business days after dispatch; EU/EEA: 3–7; rest of world: typically 5–12. Carrier tracking is included from the free-shipping threshold; smaller orders are followed on the order page. See Shipping & Delivery for costs and geography.',
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
    reply: (ctx) =>
      `We accept major cards (Visa, Mastercard, Amex) via Stripe, plus Apple Pay and Google Pay on supported devices. Checkout is PCI Level 1 secure — we never store your full card number. Your card is authorised at checkout and captured when the order is confirmed; pre-orders are charged upfront. Billing questions: ${ctx.ordersEmail}.`,
    suggestions: ['Orders', 'Welcome offer', 'FAQ'],
    links: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Cart', href: '/cart' },
    ],
  },
  {
    id: 'cancel_order',
    keywords: ['cancel', 'change order', 'amend', 'edit address', 'change address'],
    weight: 1.3,
    reply: (ctx) =>
      `Email ${ctx.ordersEmail} ASAP with your order number. Before dispatch we can usually cancel or amend free of charge. After dispatch we cannot change the address in transit — you may still use your 14-day withdrawal right after delivery where it applies. Details: Returns & Refunds.`,
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
    reply: (ctx) =>
      `After payment you will see a confirmation screen and receive an email with your order number. Account holders also see orders under Account → Orders. Selected sets are available for pre-order — the product page shows the expected ship date, and pre-orders may ship separately from in-stock items. Missing confirmation? Check spam, then email ${ctx.ordersEmail}.`,
    suggestions: ['Cancel order', 'Track order', 'Contact'],
    links: [
      { label: 'My orders', href: '/account/orders' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    id: 'returns',
    keywords: [
      'return',
      'refund',
      'damaged',
      'missing item',
      'wrong item',
      'not as described',
      'withdrawal',
      'ångerrätt',
    ],
    weight: 1.3,
    reply: (ctx) =>
      `EU/Swedish consumers generally have a 14-day right of withdrawal for distance purchases. Unopened sealed product in original condition can be returned within 14 days of delivery. Singles and opened sealed product are typically final sale unless faulty or not as described. Damaged packages: photo the box and product within 48 hours and email ${ctx.returnsEmail}. Delayed, lost or misrouted parcels: see Returns & Refunds §7 (orders help: ${ctx.ordersEmail}).`,
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
    suggestions: ['Singles condition', 'Graded slabs', 'Buy'],
    links: [
      { label: 'Buy', href: '/shop' },
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
      'Singles are graded in-house as Mint, Near Mint, Lightly Played, or Moderately Played — shown on the product page. We aim for Near Mint or better on chase cards unless stated otherwise. Browse Singles in the shop and filter by language or condition. You can also search by illustrator/artist when that info is on the listing.',
    suggestions: ['Find a card', 'Search by artist', 'Graded slabs'],
    links: [
      { label: 'Singles', href: '/shop?category=single-card' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    id: 'artist',
    keywords: ['artist', 'illustrator', 'illus', 'illustrated by', 'who drew'],
    weight: 1.25,
    reply:
      'Many single-card listings include the illustrator. Use the shop search (or the header search) and type an artist name — results match name, set, series, tags, and artist when set.',
    suggestions: ['Find a card', 'Singles', 'Buy'],
    links: [
      { label: 'Buy', href: '/shop' },
      { label: 'Singles', href: '/shop?category=single-card' },
    ],
  },
  {
    id: 'graded',
    keywords: ['graded', 'slab', 'psa', 'cgc', 'bgs', 'graded slab'],
    weight: 1.3,
    reply:
      'Graded slabs (PSA, CGC, BGS and more) live in their own shop category. Each listing shows the grade and photos of the exact slab you will receive. Ask me to find a card if you have a name or set in mind.',
    suggestions: ['Find a card', 'Buy slabs', 'Authenticity'],
    links: [
      { label: 'Graded Slabs', href: '/shop?category=graded-slab' },
      { label: 'Buy', href: '/shop' },
    ],
  },
  {
    id: 'shop',
    keywords: [
      'shop',
      'buy',
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
      `${ctx.brandName} sells sealed booster boxes, Elite Trainer Boxes, packs, single cards, graded slabs, bundles, and accessories. Use Buy by category on the homepage, or filter the shop by series, language, and condition.`,
    suggestions: ['Find a card', 'Singles', 'Graded slabs'],
    links: [
      { label: 'Buy', href: '/shop' },
      { label: 'Booster Boxes', href: '/shop?category=booster-box' },
      { label: 'Singles', href: '/shop?category=single-card' },
    ],
  },
  {
    id: 'membership',
    keywords: [
      'member',
      'membership',
      'sign up',
      'signup',
      'create account',
      'join',
      'new member',
      'welcome offer',
      'welcome discount',
      '10% off',
      'first order',
      'first purchase',
    ],
    weight: 1.35,
    reply:
      'Create a free account to unlock a welcome discount on your first paid order — it is assigned automatically when you sign up (we do not publish the code publicly). Existing accounts cannot claim that welcome offer by typing a shared code. After signup, check Account → Discount to see if your welcome offer is active.',
    suggestions: ['Create account', 'Discount codes', 'Buy'],
    links: [
      { label: 'Create account', href: '/register' },
      { label: 'Discount', href: '/account/discount' },
    ],
  },
  {
    id: 'discount',
    keywords: [
      'discount',
      'promo',
      'promo code',
      'coupon',
      'voucher',
      'rabatt',
      'discount code',
    ],
    weight: 1.3,
    reply:
      'Signed-in members can save a promo under Account → Discount; it applies automatically at checkout. Welcome offers for new accounts are first-order only and cannot be entered manually by other members. Other valid promos can be typed on the Discount page when we share them.',
    suggestions: ['Welcome offer', 'Create account', 'Checkout'],
    links: [
      { label: 'Discount', href: '/account/discount' },
      { label: 'Sign in', href: '/login' },
    ],
  },
  {
    id: 'account',
    keywords: [
      'account',
      'sign in',
      'login',
      'register',
      'my orders',
      'password',
      'google',
      'profile',
      'shipping address',
      'verify email',
    ],
    weight: 1.15,
    reply:
      'Create a free account (email or Google) for order history, a saved shipping address, currency preference, and discounts. After email signup you verify via link, then set a password. Profile, Orders, Discount, and Settings live under Account in the header menu.',
    suggestions: ['Welcome offer', 'My orders', 'Contact'],
    links: [
      { label: 'Sign in', href: '/login' },
      { label: 'Create account', href: '/register' },
      { label: 'My account', href: '/account' },
    ],
  },
  {
    id: 'trade',
    keywords: [
      'wholesale',
      'trade',
      'distributor',
      'bulk',
      'b2b',
      'supplier',
      'wholesale price',
    ],
    weight: 1.55,
    reply: (ctx) =>
      `For wholesale / trade enquiries email ${ctx.tradeEmail}. Tell us who you are and what supply you offer. Sponsorships and creative collabs go to ${ctx.partnerEmail} — see Looking for partners.`,
    suggestions: ['Partners', 'Contact', 'Buy'],
    links: [
      { label: 'Partners', href: '/partners' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    id: 'partners',
    keywords: [
      'partner',
      'partners',
      'looking for partners',
      'sponsorship',
      'sponsor',
      'collab',
      'collaboration',
      'creator',
      'influencer',
    ],
    weight: 1.35,
    reply: (ctx) =>
      `We are open to wholesalers, sponsors, creators, and local activations. Wholesale → ${ctx.tradeEmail}. Sponsorships & collabs → ${ctx.partnerEmail}. More detail on Looking for partners.`,
    suggestions: ['Wholesale', 'Contact', 'Store opening'],
    links: [
      { label: 'Partners', href: '/partners' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    id: 'privacy',
    keywords: ['privacy', 'gdpr', 'personal data', 'data protection', 'imy', 'delete my data'],
    weight: 1.35,
    reply: (ctx) =>
      `We process personal data to run the shop (orders, accounts, support). You can read the Privacy Policy for purposes, rights, and retention. Privacy requests: ${ctx.privacyEmail}. You can also contact IMY (Swedish Authority for Privacy Protection) if needed.`,
    suggestions: ['Cookies', 'Terms', 'Contact'],
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Cookies', href: '/cookies' },
    ],
  },
  {
    id: 'cookies',
    keywords: ['cookie', 'cookies', 'tracking cookies', 'local storage'],
    weight: 1.3,
    reply: (ctx) =>
      `We use strictly necessary cookies/local storage so the shop works (cart, sign-in, checkout). Non-essential analytics are not loaded without consent where required. Full details are in the Cookie Policy. Privacy: ${ctx.privacyEmail}.`,
    suggestions: ['Privacy', 'Terms', 'FAQ'],
    links: [
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Privacy', href: '/privacy' },
    ],
  },
  {
    id: 'terms',
    keywords: ['terms', 'terms of service', 'terms and conditions', 'legal', 'organisation number'],
    weight: 1.25,
    reply: (ctx) =>
      `${ctx.brandName} sells as a Swedish sole proprietorship. Organisation / VAT details and the full customer terms are on the Terms page. For questions use Contact or ${ctx.contactEmail}.`,
    suggestions: ['Privacy', 'Returns', 'Contact'],
    links: [
      { label: 'Terms', href: '/terms' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    id: 'store',
    keywords: [
      'store',
      'physical store',
      'bastad',
      'båstad',
      'opening',
      'open date',
      'launch',
      'october 15',
      'oct 15',
      'address',
      'visit',
      'shop location',
    ],
    weight: 1.4,
    reply: (ctx) =>
      `Our physical store is at ${ctx.storeLine}. Online purchases and the storefront open ${ctx.launchDateLabel} — you can browse the catalogue now; checkout unlocks on launch day.`,
    suggestions: ['Buy', 'Partners', 'Contact'],
    links: [
      { label: 'Contact / map', href: '/contact' },
      { label: 'Buy', href: '/shop' },
    ],
  },
  {
    id: 'contact',
    keywords: ['contact', 'email', 'support', 'help me', 'human', 'speak to'],
    weight: 1.2,
    reply: (ctx) =>
      `Reach us via the Contact page or email ${ctx.contactEmail} / ${ctx.supportEmail}. Typical reply: ${ctx.supportHours}. Orders: ${ctx.ordersEmail}. Returns: ${ctx.returnsEmail}.`,
    suggestions: ['FAQ', 'Returns', 'Partners'],
    links: [
      { label: 'Contact', href: '/contact' },
      { label: 'FAQ', href: '/faq' },
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
    ],
    weight: 1.5,
    productSearch: true,
    reply: 'Let me check the catalogue…',
    suggestions: ['Singles', 'Graded slabs', 'Buy'],
    links: [{ label: 'Buy', href: '/shop' }],
  },
];

export const FALLBACK_INTENT: ChatIntent = {
  id: 'fallback',
  keywords: [],
  reply: (ctx) =>
    `I am not sure about that one. Try shipping, returns, account/welcome offer, trade/partners, store opening, privacy — or a card name. FAQ / Contact: ${ctx.supportEmail}.`,
  suggestions: STARTER_SUGGESTIONS,
  links: [
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' },
    { label: 'Buy', href: '/shop' },
  ],
};

export const CHAT_STARTER_CHIPS = STARTER_SUGGESTIONS;

