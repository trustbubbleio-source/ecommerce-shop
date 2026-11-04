import { describe, expect, it } from 'vitest';
import { stripeCheckoutSessionUrl } from './stripe-dashboard';

describe('stripeCheckoutSessionUrl', () => {
  it('builds live and test dashboard URLs', () => {
    expect(stripeCheckoutSessionUrl('cs_live_abc')).toBe(
      'https://dashboard.stripe.com/checkout/sessions/cs_live_abc',
    );
    expect(stripeCheckoutSessionUrl('cs_test_abc')).toBe(
      'https://dashboard.stripe.com/test/checkout/sessions/cs_test_abc',
    );
  });

  it('skips mock / empty session ids', () => {
    expect(stripeCheckoutSessionUrl('cs_mock_ord_1')).toBeNull();
    expect(stripeCheckoutSessionUrl('')).toBeNull();
  });
});
