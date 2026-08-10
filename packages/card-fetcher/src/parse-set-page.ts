export interface PokellectorCardEntry {
  number: number;
  name: string;
  imageUrl: string;
  detailPath: string;
}

const CARD_BLOCK_RE =
  /<a\s+href="(\/[^"]+)"[^>]*name="card\d+"[^>]*>[\s\S]*?data-src="(https:\/\/den-cards\.pokellector\.com\/[^"]+)"[\s\S]*?<\/a>[\s\S]*?<div class="plaque">#(\d+)\s*-\s*([^<]+)<\/div>/g;

/** Parse a Pokellector set listing page into card entries. */
export function parseSetPageHtml(html: string): PokellectorCardEntry[] {
  const cards: PokellectorCardEntry[] = [];
  for (const match of html.matchAll(CARD_BLOCK_RE)) {
    const detailPath = match[1];
    const thumbUrl = match[2];
    const numberRaw = match[3];
    const name = match[4]?.trim();
    if (!detailPath || !thumbUrl || !numberRaw || !name) continue;
    const number = Number.parseInt(numberRaw, 10);
    if (!Number.isFinite(number)) continue;
    cards.push({
      number,
      name,
      detailPath,
      imageUrl: thumbUrl.replace(/\.thumb\.png$/i, '.png'),
    });
  }
  return cards;
}

export function findCardOnSetPage(html: string, cardNumber: number): PokellectorCardEntry | null {
  return parseSetPageHtml(html).find((card) => card.number === cardNumber) ?? null;
}
