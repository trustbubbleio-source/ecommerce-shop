import { describe, expect, it } from 'vitest';
import { parseCardNumberForLookup } from './parse-card-number.js';
import { findCardOnSetPage, parseSetPageHtml } from './parse-set-page.js';
import { pokellectorSetPageUrl } from './set-slugs.js';

const SNIPPET = `
<a href="/Ascended-Heroes-Expansion/Ns-Zoroark-ex-Card-286" name="card60554" title="N's Zoroark ex">
  <img class="card lazyload" data-src="https://den-cards.pokellector.com/426/Ns-Zoroark-ex.ASC.286.60554.thumb.png">
</a>
<div class="plaque">#286 - N's Zoroark ex</div>
<a href="/Ascended-Heroes-Expansion/Marnies-Grimmsnarl-ex-Card-287" name="card60555">
  <img data-src="https://den-cards.pokellector.com/426/Marnies-Grimmsnarl-ex.ASC.287.60555.thumb.png">
</a>
<div class="plaque">#287 - Marnie's Grimmsnarl ex</div>
`;

describe('parseCardNumberForLookup', () => {
  it('parses collector fractions', () => {
    expect(parseCardNumberForLookup('178/165')).toBe(178);
  });

  it('parses plain numbers', () => {
    expect(parseCardNumberForLookup('286')).toBe(286);
    expect(parseCardNumberForLookup('#286')).toBe(286);
  });
});

describe('parseSetPageHtml', () => {
  it('extracts card image URLs without thumb suffix', () => {
    const cards = parseSetPageHtml(SNIPPET);
    expect(cards).toHaveLength(2);
    expect(cards[0]).toMatchObject({
      number: 286,
      name: "N's Zoroark ex",
      imageUrl: 'https://den-cards.pokellector.com/426/Ns-Zoroark-ex.ASC.286.60554.png',
    });
  });

  it('finds a card by number', () => {
    const card = findCardOnSetPage(SNIPPET, 287);
    expect(card?.name).toBe("Marnie's Grimmsnarl ex");
  });
});

describe('pokellectorSetPageUrl', () => {
  it('resolves known English sets', () => {
    expect(pokellectorSetPageUrl('Ascended Heroes', 'english')).toBe(
      'https://www.pokellector.com/Ascended-Heroes-Expansion/',
    );
  });

  it('returns null for Chinese', () => {
    expect(pokellectorSetPageUrl('Ascended Heroes', 'chinese')).toBeNull();
  });
});
