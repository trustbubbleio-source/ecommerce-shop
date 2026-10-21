import { describe, expect, it } from 'vitest';
import { addressSchema } from './schemas.js';
import { SHIPPING_COUNTRIES, isShippingCountry } from './countries.js';

describe('shipping countries', () => {
  it('includes Sweden and rejects free-text junk', () => {
    expect(isShippingCountry('Sweden')).toBe(true);
    expect(isShippingCountry('swedn')).toBe(false);
    expect(SHIPPING_COUNTRIES).toContain('Germany');
  });

  it('validates address.country against the list', () => {
    const ok = addressSchema.safeParse({
      fullName: 'Ash',
      line1: '1 Lane',
      city: 'Båstad',
      postalCode: '26936',
      country: 'Sweden',
    });
    expect(ok.success).toBe(true);

    const bad = addressSchema.safeParse({
      fullName: 'Ash',
      line1: '1 Lane',
      city: 'Båstad',
      postalCode: '26936',
      country: 'Narnia',
    });
    expect(bad.success).toBe(false);
  });
});
