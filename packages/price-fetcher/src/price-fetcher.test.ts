import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchUngradedCardPrice } from '../src/fetch.js';
import { parseSetPageHtml } from '../src/parse-set-page.js';
import {
  extractCardmarketPriceEur,
  pickTcgdexCard,
  tcgdexLocale,
  tcgdexSetSearchName,
} from '../src/tcgdex.js';

const SAMPLE_HTML = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'phantasmal-flames-snippet.html'),
  'utf8',
);

describe('parse-set-page (legacy PriceCharting HTML)', () => {
  it('parses ungraded prices from set table rows', () => {
    const entries = parseSetPageHtml(SAMPLE_HTML);
    expect(entries.length).toBeGreaterThan(0);
    const charizard = entries.find((entry) => entry.cardNumber === 125);
    expect(charizard?.title).toContain('Mega Charizard X ex');
    expect(charizard?.ungradedPriceCents).toBe(83125);
  });
});

describe('parsePriceChartingDollars', () => {
  it('parses comma-separated dollar amounts', async () => {
    const { parsePriceChartingDollars } = await import('../src/parse-price.js');
    expect(parsePriceChartingDollars('$2,810.86')).toBe(281086);
    expect(parsePriceChartingDollars('$5.00')).toBe(500);
  });
});

describe('tcgdex helpers', () => {
  it('maps languages and set name overrides', () => {
    expect(tcgdexLocale('english')).toBe('en');
    expect(tcgdexLocale('japanese')).toBe('ja');
    expect(tcgdexLocale('chinese')).toBe('zh-cn');
    expect(tcgdexSetSearchName('Scarlet & Violet - 151')).toBe('151');
    expect(tcgdexSetSearchName('Phantasmal Flames')).toBe('Phantasmal Flames');
  });

  it('picks the exact localId and prefers a name match when ambiguous', () => {
    const briefs = [
      { id: 'a-001', localId: '001', name: 'Bulbasaur' },
      { id: 'a-010', localId: '010', name: 'Caterpie' },
      { id: 'a-193', localId: '193', name: 'Mew ex' },
      { id: 'a-193b', localId: '193', name: 'Mewtwo ex' },
    ];
    expect(pickTcgdexCard(briefs, 1)?.id).toBe('a-001');
    expect(pickTcgdexCard(briefs, 193, 'Mewtwo')?.id).toBe('a-193b');
  });

  it('extracts Cardmarket EUR trend into a positive amount', () => {
    const eur = extractCardmarketPriceEur({
      id: 'sv03.5-193',
      localId: '193',
      name: 'Mew ex',
      variants_detailed: [
        {
          pricing: {
            cardmarket: {
              unit: 'EUR',
              trend: 29.82,
              avg: 30.45,
              idProduct: 733788,
            },
          },
        },
      ],
    });
    expect(eur).toBe(29.82);
  });

  it('falls back to holo Cardmarket fields when normal prices are empty', () => {
    const eur = extractCardmarketPriceEur({
      id: 'x',
      localId: '1',
      name: 'Holo only',
      variants_detailed: [
        {
          pricing: {
            cardmarket: {
              trend: null,
              avg: null,
              'trend-holo': 12.5,
            },
          },
        },
      ],
    });
    expect(eur).toBe(12.5);
  });
});

describe('fetchUngradedCardPrice', () => {
  it('resolves a Cardmarket EUR price through TCGdex', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/cards?')) {
        return new Response(
          JSON.stringify([{ id: 'sv03.5-193', localId: '193', name: 'Mew ex' }]),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      return new Response(
        JSON.stringify({
          id: 'sv03.5-193',
          localId: '193',
          name: 'Mew ex',
          variants_detailed: [
            {
              pricing: {
                cardmarket: { trend: 29.82, avg: 30.45, idProduct: 733788 },
              },
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    });

    const result = await fetchUngradedCardPrice(
      { set: '151', cardNumber: '193/165', language: 'english', name: 'Mew ex' },
      { fetch: fetchImpl as typeof fetch },
    );

    expect(result.cardName).toBe('Mew ex');
    expect(result.priceCents).toBe(2982);
    expect(result.sourceUrl).toContain('733788');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
