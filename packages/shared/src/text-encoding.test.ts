import { describe, expect, it } from 'vitest';
import { repairMojibakeText } from './text-encoding.js';

describe('repairMojibakeText', () => {
  it('fixes known product name corruptions', () => {
    expect(repairMojibakeText('PokAcmon 151 Booster Box')).toBe('Pokémon 151 Booster Box');
    expect(repairMojibakeText('PokÃ©mon 151')).toBe('Pokémon 151');
  });

  it('fixes common UTF-8/Latin-1 mojibake sequences', () => {
    expect(repairMojibakeText('Loadingâ€¦')).toBe('Loading…');
    expect(repairMojibakeText('BÃ¥stad')).toBe('Båstad');
    expect(repairMojibakeText('Vault XÂ®')).toBe('Vault X®');
  });

  it('leaves correct UTF-8 text unchanged', () => {
    expect(repairMojibakeText('Pokémon 151 Booster Box')).toBe('Pokémon 151 Booster Box');
    expect(repairMojibakeText('Poké Pad')).toBe('Poké Pad');
  });
});
