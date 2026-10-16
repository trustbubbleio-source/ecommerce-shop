/**
 * Repair common UTF-8 → Latin-1 mojibake and a few known bad product strings.
 * Safe to run on already-correct text (patterns only match corrupted sequences).
 */
const REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/PokAcmon/gi, 'Pokémon'],
  [/PokÃ©mon/g, 'Pokémon'],
  [/PokÃ©/g, 'Poké'],
  [/Ã©/g, 'é'],
  [/Ã¨/g, 'è'],
  [/Ã¤/g, 'ä'],
  [/Ã¶/g, 'ö'],
  [/Ã¥/g, 'å'],
  [/Ã¼/g, 'ü'],
  [/Ã±/g, 'ñ'],
  [/Â©/g, '©'],
  [/Â®/g, '®'],
  [/â€¦/g, '…'],
  [/â€™/g, '’'],
  [/â€˜/g, '‘'],
  [/â€œ/g, '“'],
  [/â€/g, '”'],
  [/â€“/g, '–'],
  [/â€”/g, '—'],
];

export function repairMojibakeText(value: string): string {
  let out = value;
  for (const [pattern, replacement] of REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
