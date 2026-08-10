import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const USER_AGENT = 'OneMoreRip-price-fetcher/1.0';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, 'src/data/set-slugs.en.json');

const TITLE_LINK_RE =
  /<a href="\/console\/(pokemon-[^"]+)"[^>]*title="Pokemon ([^"]+)"/gi;
const BROWSE_LINK_RE = /href="\/console\/(pokemon-[^"]+)">Pokemon ([^<]+)<\/a>/gi;

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

async function fetchCategoryHtml(): Promise<string> {
  const res = await fetch('https://www.pricecharting.com/category/pokemon-cards', {
    headers: { 'user-agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`PriceCharting category returned ${res.status}`);
  return res.text();
}

function parseSlugs(html: string): Record<string, string> {
  const map: Record<string, string> = {};

  const add = (rawSlug: string, rawTitle: string) => {
    const slug = decodeHtml(rawSlug);
    const title = decodeHtml(rawTitle);
    if (!slug || !title || slug.includes('japanese-') || slug.includes('chinese-')) return;
    map[title] = slug;
  };

  for (const match of html.matchAll(BROWSE_LINK_RE)) {
    add(match[1] ?? '', match[2] ?? '');
  }
  for (const match of html.matchAll(TITLE_LINK_RE)) {
    add(match[1] ?? '', match[2] ?? '');
  }

  return map;
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });

const html = await fetchCategoryHtml();
const slugs = parseSlugs(html);
fs.writeFileSync(outPath, `${JSON.stringify(slugs, null, 2)}\n`);
console.log(`Wrote ${Object.keys(slugs).length} English set slugs → ${outPath}`);
