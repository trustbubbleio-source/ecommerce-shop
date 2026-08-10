import type { ProductLanguage, ProductSet } from '@akknerds/shared';
import { findCardOnSetPage } from './parse-set-page.js';
import { parseCardNumberForLookup } from './parse-card-number.js';
import { pokellectorSetPageUrl } from './set-slugs.js';

const USER_AGENT = 'OneMoreRip-CardFetcher/1.0 (+https://onemorerip.shop)';
const FETCH_TIMEOUT_MS = 15_000;

export interface FetchCardImageInput {
  set: ProductSet;
  cardNumber: string;
  language: ProductLanguage;
}

export interface FetchCardImageResult {
  cardName: string;
  cardNumber: number;
  sourceUrl: string;
  imageUrl: string;
  buffer: Buffer;
  contentType: string;
}

export class CardFetchError extends Error {
  constructor(
    message: string,
    readonly code: 'unsupported' | 'not_found' | 'network' | 'parse',
  ) {
    super(message);
    this.name = 'CardFetchError';
  }
}

export interface FetchCardImageOptions {
  fetchHtml?: typeof fetch;
  fetchImage?: typeof fetch;
}

async function timedFetch(
  url: string,
  init: RequestInit,
  fetchImpl: typeof fetch,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetchImpl(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html,application/xhtml+xml,image/*,*/*',
        ...init.headers,
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Resolve a card image from Pokellector and download the PNG bytes. */
export async function fetchCardImageFromPokellector(
  input: FetchCardImageInput,
  options: FetchCardImageOptions = {},
): Promise<FetchCardImageResult> {
  const fetchHtml = options.fetchHtml ?? fetch;
  const fetchImage = options.fetchImage ?? fetch;

  const cardNumber = parseCardNumberForLookup(input.cardNumber);
  if (cardNumber === null) {
    throw new CardFetchError('Enter a card number like 286 or 178/165', 'parse');
  }

  const setPageUrl = pokellectorSetPageUrl(input.set, input.language);
  if (!setPageUrl) {
    throw new CardFetchError(
      input.language === 'chinese'
        ? 'Chinese cards are not available on Pokellector — upload an image manually'
        : `No Pokellector mapping for set "${input.set}"`,
      'unsupported',
    );
  }

  const pageRes = await timedFetch(setPageUrl, { method: 'GET' }, fetchHtml);
  if (!pageRes.ok) {
    throw new CardFetchError(`Pokellector set page returned ${pageRes.status}`, 'network');
  }

  const html = await pageRes.text();
  const card = findCardOnSetPage(html, cardNumber);
  if (!card) {
    throw new CardFetchError(
      `Card #${cardNumber} not found in ${input.set}`,
      'not_found',
    );
  }

  const imageRes = await timedFetch(card.imageUrl, { method: 'GET' }, fetchImage);
  if (!imageRes.ok) {
    throw new CardFetchError(`Card image download failed (${imageRes.status})`, 'network');
  }

  const contentType = imageRes.headers.get('content-type') ?? 'image/png';
  const buffer = Buffer.from(await imageRes.arrayBuffer());
  if (buffer.byteLength === 0) {
    throw new CardFetchError('Downloaded image was empty', 'network');
  }

  return {
    cardName: card.name,
    cardNumber,
    sourceUrl: card.imageUrl,
    imageUrl: card.imageUrl,
    buffer,
    contentType: contentType.split(';')[0]?.trim() || 'image/png',
  };
}

/** Deterministic S3 object key for a fetched card (enables cache hits). */
export function cardImageObjectKey(input: {
  language: ProductLanguage;
  set: ProductSet;
  cardNumber: number;
}): string {
  const safeSet = input.set
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `products/pokellector/${input.language}/${safeSet}/${input.cardNumber}.png`;
}
