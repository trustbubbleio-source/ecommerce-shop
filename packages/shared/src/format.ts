/** Formatting helpers shared across the app. */

/**
 * Format an integer amount of cents into a localized currency string.
 * @example formatPrice(1299) // "$12.99"
 */
export function formatPrice(cents: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

/** Convert an arbitrary label into a URL-safe slug. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Human-readable label for a product category. */
const CATEGORY_LABELS: Record<string, string> = {
  'booster-box': 'Booster Box',
  'elite-trainer-box': 'Elite Trainer Box',
  'booster-pack': 'Booster Pack',
  'single-card': 'Single Card',
  bundle: 'Bundle',
  accessory: 'Accessory',
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? titleCase(category.replace(/-/g, ' '));
}

export function titleCase(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Percentage saved when a product has a compare-at price. */
export function discountPercent(price: number, compareAtPrice?: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}
