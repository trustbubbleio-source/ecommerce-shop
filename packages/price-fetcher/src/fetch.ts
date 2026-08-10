import { parseCardNumberForLookup } from '@akknerds/card-fetcher';
import type { ProductLanguage, ProductSet } from '@akknerds/shared';
import { PriceFetchError } from './errors.js';
import { findCardOnSetPage, parseSetPageHtml } from './parse-set-page.js';
import { priceChartingSetPageUrl } from './set-slugs.js';

const DEFAULT_USER_AGENT = 'OneMoreRip-price-fetcher/1.0 (+https://onemorerip.shop)';
const FETCH_TIMEOUT_MS = 20_000;

export interface FetchCardPriceInput {
  set: ProductSet;
  cardNumber: string;
  language?: ProductLanguage;
  name?: string;
}

export interface FetchCardPriceResult {
  cardName: string;
  cardNumber: number;
  priceCents: number;
  sourceUrl: string;
  setPageUrl: string;
}

export interface FetchCardPriceOptions {
  fetch?: typeof fetch;
}

async function httpGet(url: string, fetchImpl: typeof fetch): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, {
      signal: controller.signal,
      headers: { 'user-agent': DEFAULT_USER_AGENT },
    });
    if (!res.ok) {
      throw new PriceFetchError(`PriceCharting returned ${res.status}`, 'network');
    }
    return await res.text();
  } catch (error) {
    if (error instanceof PriceFetchError) throw error;
    throw new PriceFetchError('Could not reach PriceCharting', 'network');
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchUngradedPriceFromPriceCharting(
  input: FetchCardPriceInput,
  options: FetchCardPriceOptions = {},
): Promise<FetchCardPriceResult> {
  const language = input.language ?? 'english';
  const lookupNumber = parseCardNumberForLookup(input.cardNumber);
  if (lookupNumber === null) {
    throw new PriceFetchError('Enter a card number like 286 or 178/165', 'parse');
  }

  const setPageUrl = priceChartingSetPageUrl(input.set, language);
  if (!setPageUrl) {
    throw new PriceFetchError(`No PriceCharting mapping for set "${input.set}"`, 'unsupported');
  }

  const fetchImpl = options.fetch ?? fetch;
  const html = await httpGet(setPageUrl, fetchImpl);
  const entries = parseSetPageHtml(html);
  if (entries.length === 0) {
    throw new PriceFetchError('Could not parse card prices from PriceCharting', 'parse');
  }

  const card = findCardOnSetPage(entries, lookupNumber, input.name);
  if (!card) {
    throw new PriceFetchError(
      `Card #${lookupNumber} not found on PriceCharting for ${input.set}`,
      'not_found',
    );
  }

  const sourceUrl = card.detailPath.startsWith('http')
    ? card.detailPath
    : `https://www.pricecharting.com${card.detailPath}`;

  return {
    cardName: card.title,
    cardNumber: card.cardNumber,
    priceCents: card.ungradedPriceCents,
    sourceUrl,
    setPageUrl,
  };
}
