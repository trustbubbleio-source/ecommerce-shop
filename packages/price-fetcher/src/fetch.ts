import { parseCardNumberForLookup } from '@akknerds/card-fetcher';
import type { ProductLanguage, ProductSet } from '@akknerds/shared';
import { PriceFetchError } from './errors.js';
import {
  extractCardmarketPriceEur,
  pickTcgdexCard,
  tcgdexGetJson,
  tcgdexLocale,
  tcgdexSetSearchName,
  type TcgdexCardBrief,
  type TcgdexCardDetail,
} from './tcgdex.js';

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

/**
 * Ungraded market price via TCGdex (Cardmarket EUR).
 * Replaces PriceCharting HTML scraping, which Cloudflare now blocks.
 */
export async function fetchUngradedPriceFromPriceCharting(
  input: FetchCardPriceInput,
  options: FetchCardPriceOptions = {},
): Promise<FetchCardPriceResult> {
  return fetchUngradedCardPrice(input, options);
}

export async function fetchUngradedCardPrice(
  input: FetchCardPriceInput,
  options: FetchCardPriceOptions = {},
): Promise<FetchCardPriceResult> {
  const language = input.language ?? 'english';
  const lookupNumber = parseCardNumberForLookup(input.cardNumber);
  if (lookupNumber === null) {
    throw new PriceFetchError('Enter a card number like 286 or 178/165', 'parse');
  }

  const locale = tcgdexLocale(language);
  const setName = tcgdexSetSearchName(input.set);
  const fetchImpl = options.fetch ?? fetch;
  const setPageUrl = `https://api.tcgdex.net/v2/${locale}/sets?name=${encodeURIComponent(setName)}`;

  let briefs: TcgdexCardBrief[];
  try {
    const query = new URLSearchParams({
      localId: String(lookupNumber),
      'set.name': setName,
    });
    briefs = await tcgdexGetJson<TcgdexCardBrief[]>(
      `/${locale}/cards?${query.toString()}`,
      fetchImpl,
    );
  } catch (error) {
    if (error instanceof PriceFetchError) throw error;
    throw new PriceFetchError('Could not reach TCGdex price API', 'network');
  }

  const brief = pickTcgdexCard(briefs, lookupNumber, input.name);
  if (!brief) {
    throw new PriceFetchError(
      `Card #${lookupNumber} not found on TCGdex for ${input.set}`,
      'not_found',
    );
  }

  let detail: TcgdexCardDetail;
  try {
    detail = await tcgdexGetJson<TcgdexCardDetail>(
      `/${locale}/cards/${encodeURIComponent(brief.id)}`,
      fetchImpl,
    );
  } catch (error) {
    if (error instanceof PriceFetchError) throw error;
    throw new PriceFetchError('Could not load card price from TCGdex', 'network');
  }

  const priceEur = extractCardmarketPriceEur(detail);
  if (priceEur === null) {
    throw new PriceFetchError(
      `No Cardmarket price listed yet for ${detail.name} #${lookupNumber}`,
      'not_found',
    );
  }

  const priceCents = Math.round(priceEur * 100);
  const cmId = detail.variants_detailed?.find((v) => v.pricing?.cardmarket?.idProduct)?.pricing
    ?.cardmarket?.idProduct;
  const sourceUrl = cmId
    ? `https://www.cardmarket.com/en/Pokemon/Products?idProduct=${cmId}`
    : `https://www.tcgdex.net/card/${encodeURIComponent(detail.id)}`;

  return {
    cardName: detail.name,
    cardNumber: lookupNumber,
    priceCents,
    sourceUrl,
    setPageUrl,
  };
}
