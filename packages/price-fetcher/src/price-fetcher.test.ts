import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSetPageHtml } from '../src/parse-set-page.js';

const SAMPLE_HTML = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'phantasmal-flames-snippet.html'),
  'utf8',
);

describe('parse-set-page', () => {
  it('parses ungraded prices from set table rows', () => {
    const entries = parseSetPageHtml(SAMPLE_HTML);
    expect(entries.length).toBeGreaterThan(0);
    const charizard = entries.find((entry) => entry.cardNumber === 125);
    expect(charizard?.title).toContain('Mega Charizard X ex');
    expect(charizard?.ungradedPriceCents).toBe(83125);
  });

  it('finds a card by number and disambiguates with name', () => {
    const entries = parseSetPageHtml(SAMPLE_HTML);
    const card = entries.find((entry) => entry.cardNumber === 125);
    expect(card?.ungradedPriceCents).toBe(83125);
  });
});

describe('parsePriceChartingDollars', () => {
  it('parses comma-separated dollar amounts', async () => {
    const { parsePriceChartingDollars } = await import('../src/parse-price.js');
    expect(parsePriceChartingDollars('$2,810.86')).toBe(281086);
    expect(parsePriceChartingDollars('$5.00')).toBe(500);
  });
});
