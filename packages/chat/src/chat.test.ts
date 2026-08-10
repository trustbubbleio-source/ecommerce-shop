import { describe, expect, it } from 'vitest';
import { createChatContext } from '../src/context.js';
import { extractProductSearchQuery, matchIntent } from '../src/match.js';

const ctx = createChatContext({
  brandName: 'One More Rip',
  supportEmail: 'contact@onemorerip.cards',
});

describe('matchIntent', () => {
  it('matches shipping vs payments', () => {
    const shipping = matchIntent('How long does shipping take?', ctx);
    expect(shipping.intentId).toBe('shipping');
    expect(shipping.kind).toBe('reply');
    expect(shipping.reply.toLowerCase()).toContain('business day');

    const payments = matchIntent('Is Stripe checkout secure?', ctx);
    expect(payments.intentId).toBe('payments');
    expect(payments.reply.toLowerCase()).toContain('stripe');
  });

  it('uses free-shipping threshold from shared pricing', () => {
    const result = matchIntent('Do you offer free shipping?', ctx);
    expect(result.intentId).toBe('free_shipping');
    expect(result.reply).toContain(ctx.freeShippingLabel);
  });

  it('detects product search and extracts a query', () => {
    const result = matchIntent('Do you have Charizard ex?', ctx);
    expect(result.kind).toBe('product_search');
    expect(result.searchQuery?.toLowerCase()).toContain('charizard');
  });

  it('falls back when nothing matches', () => {
    const result = matchIntent('asdf qwerty zxcv', ctx);
    expect(result.intentId).toBe('fallback');
    expect(result.links.some((l) => l.href === '/faq')).toBe(true);
  });
});

describe('extractProductSearchQuery', () => {
  it('parses looking-for phrases', () => {
    expect(extractProductSearchQuery('Looking for Surging Sparks ETB')).toBe(
      'Surging Sparks ETB',
    );
  });
});
