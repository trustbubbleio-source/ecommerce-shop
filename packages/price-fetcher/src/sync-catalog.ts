import type { CreateProductInput, Product } from '@akknerds/shared';
import { PriceFetchError } from './errors.js';
import { fetchUngradedPriceFromPriceCharting } from './fetch.js';

export type PriceSyncStatus = 'updated' | 'skipped' | 'error';

export interface PriceSyncOutcome {
  productId: string;
  productName: string;
  status: PriceSyncStatus;
  priceCents?: number;
  sourceUrl?: string;
  message?: string;
}

export interface SyncSingleCardPricesOptions {
  fetch?: typeof fetch;
  delayMs?: number;
  onUpdate: (product: Product, priceCents: number, sourceUrl: string) => Promise<void>;
}

export function productToUpdateInput(product: Product, priceCents: number): CreateProductInput {
  return {
    name: product.name,
    description: product.description,
    category: product.category,
    set: product.set,
    series: product.series,
    price: priceCents,
    compareAtPrice: product.compareAtPrice,
    stock: product.stock,
    accent: product.accent,
    images: product.images.length > 0 ? product.images : product.image ? [product.image] : [],
    featured: product.featured,
    isNew: product.isNew,
    tags: product.tags as CreateProductInput['tags'],
    cardNumber: product.cardNumber,
    rarity: product.rarity!,
    condition: product.condition!,
    language: product.language,
    releaseDate: product.releaseDate,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function syncSingleCardPrices(
  products: Product[],
  options: SyncSingleCardPricesOptions,
): Promise<PriceSyncOutcome[]> {
  const outcomes: PriceSyncOutcome[] = [];
  const singles = products.filter((product) => product.category === 'single-card');
  const delayMs = options.delayMs ?? 750;

  for (const [index, product] of singles.entries()) {
    if (!product.cardNumber?.trim()) {
      outcomes.push({
        productId: product.id,
        productName: product.name,
        status: 'skipped',
        message: 'Missing card number',
      });
      continue;
    }

    try {
      const quote = await fetchUngradedPriceFromPriceCharting(
        {
          set: product.set,
          cardNumber: product.cardNumber,
          language: product.language,
          name: product.name,
        },
        { fetch: options.fetch },
      );

      if (quote.priceCents === product.price) {
        outcomes.push({
          productId: product.id,
          productName: product.name,
          status: 'skipped',
          priceCents: quote.priceCents,
          sourceUrl: quote.sourceUrl,
          message: 'Price unchanged',
        });
      } else {
        await options.onUpdate(product, quote.priceCents, quote.sourceUrl);
        outcomes.push({
          productId: product.id,
          productName: product.name,
          status: 'updated',
          priceCents: quote.priceCents,
          sourceUrl: quote.sourceUrl,
        });
      }
    } catch (error) {
      outcomes.push({
        productId: product.id,
        productName: product.name,
        status: 'error',
        message: error instanceof PriceFetchError ? error.message : 'Price sync failed',
      });
    }

    if (index < singles.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  return outcomes;
}
