import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const USER_AGENT = 'OneMoreRip-CardFetcher/1.0';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, 'src/data/set-slugs.en.json');

const BUTTON_RE =
  /<a class="button"[^>]*href="(\/[^"]+\/)"[^>]*title="([^"]+)"[^>]*><img[^>]*><img[^>]*><span>([^<]+)<\/span>/g;

async function fetchSetsHtml(): Promise<string> {
  const res = await fetch('https://www.pokellector.com/sets', {
    headers: { 'user-agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`Pokellector /sets returned ${res.status}`);
  return res.text();
}

function parseSlugs(html: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const match of html.matchAll(BUTTON_RE)) {
    const href = match[1];
    const label = match[3]?.trim();
    if (!href || !label) continue;
    map[label] = href.replace(/^\/|\/$/g, '');
  }
  return map;
}

const html = await fetchSetsHtml();
const slugs = parseSlugs(html);
fs.writeFileSync(outPath, `${JSON.stringify(slugs, null, 2)}\n`);
console.log(`Wrote ${Object.keys(slugs).length} English set slugs → ${outPath}`);
