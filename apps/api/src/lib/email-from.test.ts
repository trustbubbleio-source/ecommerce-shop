import { describe, expect, it } from 'vitest';
import { withBrandFrom } from './email.js';

describe('withBrandFrom', () => {
  it('adds One More Rip when only an address is provided', () => {
    expect(withBrandFrom('noreply@onemorerip.cards')).toBe(
      'One More Rip <noreply@onemorerip.cards>',
    );
  });

  it('replaces a bare noreply display name', () => {
    expect(withBrandFrom('noreply <noreply@onemorerip.cards>')).toBe(
      'One More Rip <noreply@onemorerip.cards>',
    );
  });

  it('keeps the address when the brand is already set', () => {
    expect(withBrandFrom('One More Rip <orders@onemorerip.cards>')).toBe(
      'One More Rip <orders@onemorerip.cards>',
    );
  });
});
