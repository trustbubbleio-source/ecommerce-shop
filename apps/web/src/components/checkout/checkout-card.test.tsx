import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api } from '@akknerds/api-client';
import { type CartProduct, useCartStore } from '../../store/cart';
import { useCheckoutStore } from '../../store/checkout';
import { renderWithProviders } from '../../test/utils';
import { CheckoutForm } from './checkout-form';

const eligibleMethodsState = vi.hoisted(() => ({
  current: {
    eligiblePaymentMethods: { isEligible: () => true } as
      | { isEligible: (method: string) => boolean }
      | null,
    isLoading: false,
    error: null as Error | null,
  },
}));

vi.mock('../../lib/paypal', () => {
  const React = require('react') as typeof import('react');
  return {
    PayPalProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    PayPalCardFieldsProvider: ({
      children,
      validitychange,
    }: {
      children: React.ReactNode;
      validitychange?: (event: unknown) => void;
    }) => {
      React.useEffect(() => {
        validitychange?.({
          fields: {
            number: { isValid: true },
            expiry: { isValid: true },
            cvv: { isValid: true },
            name: { isValid: true },
          },
        });
      }, [validitychange]);
      return <div data-testid="card-fields">{children}</div>;
    },
    PayPalCardNameField: () => <div />,
    PayPalCardNumberField: () => <div />,
    PayPalCardExpiryField: () => <div />,
    PayPalCardCvvField: () => <div />,
    PayPalOneTimePaymentButton: () => <button type="button">PayPal wallet</button>,
    useEligibleMethods: () => ({ ...eligibleMethodsState.current }),
    usePayPalCardFieldsOneTimePaymentSession: () => ({
      submit: vi.fn(async () => undefined),
      submitResponse: { state: 'succeeded', data: { orderId: 'pp_1' } },
      error: null,
    }),
    usePayPal: () => ({}),
  };
});

function cartProduct(): CartProduct {
  return {
    id: 'bb-151',
    slug: 'bb-151',
    name: 'Booster Box',
    price: 16999,
    accent: '#fff',
    category: 'booster-box',
    set: '151',
    series: 'Scarlet & Violet',
    currency: 'sek',
    stock: 5,
  };
}

async function fillAddress() {
  await userEvent.type(screen.getByLabelText('Email'), 'buyer@example.com');
  await userEvent.type(screen.getByLabelText('Full name'), 'Ash Ketchum');
  await userEvent.type(screen.getByLabelText('Address'), '1 Pallet Lane');
  await userEvent.type(screen.getByLabelText('City'), 'Pallet');
  await userEvent.type(screen.getByLabelText('Postal code'), '00001');
  await userEvent.selectOptions(screen.getByLabelText('Country'), 'Sweden');
}

beforeEach(() => {
  useCartStore.setState({ items: [{ product: cartProduct(), quantity: 1 }] });
  useCheckoutStore.getState().clear();
  vi.restoreAllMocks();
  eligibleMethodsState.current = {
    eligiblePaymentMethods: { isEligible: () => true },
    isLoading: false,
    error: null,
  };
  vi.spyOn(api, 'getCheckoutConfig').mockResolvedValue({
    provider: 'paypal',
    environment: 'sandbox',
    clientId: 'test-client',
    currency: 'SEK',
    locale: 'sv-SE',
    methods: { cardFields: true, paypalButton: true, redirect: true },
  });
});

describe('CheckoutForm card flow', () => {
  it('runs checkout → submit → capturePayment and navigates to success', async () => {
    vi.spyOn(api, 'checkout').mockResolvedValue({
      orderId: 'ord_card_1',
      paypalOrderId: 'pp_order_1',
      url: null,
      status: 'pending',
    });
    vi.spyOn(api, 'capturePayment').mockResolvedValue({ status: 'paid', ok: true });

    const { Router } = await import('react-router-dom');
    void Router;

    renderWithProviders(<CheckoutForm />);
    expect(await screen.findByTestId('card-fields')).toBeInTheDocument();

    await fillAddress();
    await userEvent.click(screen.getByRole('checkbox', { name: /I agree to the/i }));
    await userEvent.click(screen.getByRole('button', { name: /pay now/i }));

    await waitFor(() => expect(api.checkout).toHaveBeenCalled());
    expect(vi.mocked(api.checkout).mock.calls[0]![0].paymentMethod).toBe('card');
    await waitFor(() =>
      expect(api.capturePayment).toHaveBeenCalledWith('ord_card_1', {
        paypalOrderId: 'pp_order_1',
      }),
    );
  });

  it('shows decline message on 402 from capture', async () => {
    vi.spyOn(api, 'checkout').mockResolvedValue({
      orderId: 'ord_card_2',
      paypalOrderId: 'pp_order_2',
      url: null,
      status: 'pending',
    });
    vi.spyOn(api, 'capturePayment').mockRejectedValue(
      new ApiError('Your card was declined', 402, { code: 'PAYMENT_DECLINED' }),
    );

    renderWithProviders(<CheckoutForm />);
    expect(await screen.findByTestId('card-fields')).toBeInTheDocument();
    await fillAddress();
    await userEvent.click(screen.getByRole('checkbox', { name: /I agree to the/i }));
    await userEvent.click(screen.getByRole('button', { name: /pay now/i }));

    expect(await screen.findByText(/card was declined/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pay now/i })).toBeInTheDocument();
  });

  it('keeps redirect-only UI when card fields flag is off', async () => {
    vi.mocked(api.getCheckoutConfig).mockResolvedValue({
      provider: 'paypal',
      environment: 'sandbox',
      clientId: 'test-client',
      currency: 'SEK',
      locale: 'sv-SE',
      methods: { cardFields: false, paypalButton: false, redirect: true },
    });
    renderWithProviders(<CheckoutForm />);
    expect(await screen.findByRole('button', { name: /pay now/i })).toBeInTheDocument();
    expect(screen.queryByTestId('card-fields')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with paypal/i })).toBeInTheDocument();
  });

  it('still shows card UI when PayPal eligibility service errors', async () => {
    eligibleMethodsState.current = {
      eligiblePaymentMethods: null,
      isLoading: false,
      error: new Error('ERR_INIT_FIND_ELIGIBLE_METHODS'),
    };

    renderWithProviders(<CheckoutForm />);
    expect(await screen.findByTestId('card-fields')).toBeInTheDocument();
    expect(screen.getByText(/^Express checkout$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Card details$/i)).toBeInTheDocument();
    expect(screen.queryByText(/card fields could not load/i)).not.toBeInTheDocument();
  });

  it('falls back to enabled Pay now redirect when no methods are eligible', async () => {
    eligibleMethodsState.current = {
      eligiblePaymentMethods: { isEligible: () => false },
      isLoading: false,
      error: null,
    };

    vi.spyOn(api, 'checkout').mockResolvedValue({
      orderId: 'ord_fallback_1',
      paypalOrderId: 'pp_fallback_1',
      url: 'https://paypal.test/approve',
      status: 'pending',
    });

    renderWithProviders(<CheckoutForm />);
    await waitFor(() => {
      expect(screen.getByText(/card fields could not load/i)).toBeInTheDocument();
    });

    await fillAddress();
    await userEvent.click(screen.getByRole('checkbox', { name: /I agree to the/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pay now/i })).toBeEnabled();
    });
    await userEvent.click(screen.getByRole('button', { name: /pay now/i }));

    await waitFor(() => expect(api.checkout).toHaveBeenCalled());
    expect(vi.mocked(api.checkout).mock.calls[0]![0].paymentMethod).toBe('redirect');
  });
});
