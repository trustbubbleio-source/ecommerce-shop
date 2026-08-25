import { describe, expect, it } from 'vitest';
import { createChatContext } from '../src/context.js';
import { extractProductSearchQuery, matchIntent } from '../src/match.js';

const ctx = createChatContext({
  brandName: 'One More Rip',
  supportEmail: 'support@onemorerip.cards',
  contactEmail: 'contact@onemorerip.cards',
  ordersEmail: 'orders@onemorerip.cards',
  returnsEmail: 'returns@onemorerip.cards',
  privacyEmail: 'privacy@onemorerip.cards',
  partnerEmail: 'partner@onemorerip.cards',
  tradeEmail: 'trade@onemorerip.cards',
  storeLine: 'Hallandsvägen 21, 269 36 Båstad, Sweden',
  launchDateLabel: 'October 15, 2026',
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

  it('points returns damage claims to the returns mailbox', () => {
    const result = matchIntent('My package arrived damaged', ctx);
    expect(result.intentId).toBe('returns');
    expect(result.reply).toContain(ctx.returnsEmail);
  });

  it('covers welcome offer / membership without leaking promo codes', () => {
    const result = matchIntent('Do new members get 10% off first order?', ctx);
    expect(result.intentId).toBe('membership');
    expect(result.reply.toLowerCase()).toContain('welcome');
    expect(result.reply).not.toMatch(/ONEMORERIP10/i);
  });

  it('routes wholesale to trade email', () => {
    const result = matchIntent('Do you do wholesale / trade?', ctx);
    expect(result.intentId).toBe('trade');
    expect(result.reply).toContain(ctx.tradeEmail);
  });

  it('routes partners and sponsorships', () => {
    const result = matchIntent('Looking for a sponsorship collab', ctx);
    expect(result.intentId).toBe('partners');
    expect(result.reply).toContain(ctx.partnerEmail);
  });

  it('answers store opening / Båstad', () => {
    const result = matchIntent('When does the Båstad store open?', ctx);
    expect(result.intentId).toBe('store');
    expect(result.reply).toContain(ctx.launchDateLabel);
    expect(result.reply).toContain('Hallandsvägen');
  });

  it('covers privacy and cookies', () => {
    expect(matchIntent('What is your privacy policy / GDPR?', ctx).intentId).toBe('privacy');
    expect(matchIntent('Do you use cookies?', ctx).intentId).toBe('cookies');
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
