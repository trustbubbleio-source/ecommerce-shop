import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@akknerds/api-client';
import { type CartProduct, useCartStore } from '../../store/cart';
import { renderWithProviders } from '../../test/utils';
import { CheckoutForm } from './checkout-form';

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

beforeEach(() => {
  useCartStore.setState({
    items: [{ product: cartProduct(), quantity: 1 }],
    deliveryMethod: 'shipping',
  });
  vi.restoreAllMocks();
  vi.spyOn(api, 'getCheckoutConfig').mockResolvedValue({
    provider: 'mock',
    environment: 'sandbox',
    clientId: '',
    currency: 'SEK',
    locale: 'sv-SE',
    methods: { cardFields: false, paypalButton: false, swishButton: false, redirect: true },
  });
});

async function fillAddress() {
  await userEvent.type(screen.getByLabelText('Email'), 'buyer@example.com');
  await userEvent.type(screen.getByLabelText('Full name'), 'Ash Ketchum');
  await userEvent.type(screen.getByLabelText('Address'), '1 Pallet Lane');
  await userEvent.type(screen.getByLabelText('City'), 'Pallet');
  await userEvent.type(screen.getByLabelText('Postal code'), '00001');
  await userEvent.selectOptions(screen.getByLabelText('Country'), 'Sweden');
}

describe('CheckoutForm', () => {
  it('validates required fields before submitting', async () => {
    const spy = vi.spyOn(api, 'checkout');
    renderWithProviders(<CheckoutForm />);
    await userEvent.click(screen.getByRole('button', { name: /pay now/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('requires Terms acceptance before submitting', async () => {
    const spy = vi.spyOn(api, 'checkout');
    renderWithProviders(<CheckoutForm />);
    await fillAddress();
    await userEvent.click(screen.getByRole('button', { name: /pay now/i }));
    expect(await screen.findByText(/accept the Terms and Returns/i)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('submits the order and redirects to the checkout URL', async () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, assign },
      writable: true,
    });
    vi.spyOn(api, 'checkout').mockResolvedValue({
      url: '/checkout/success?order_id=ord_1',
      orderId: 'ord_1',
    });

    renderWithProviders(<CheckoutForm />);
    await fillAddress();
    await userEvent.click(screen.getByRole('checkbox', { name: /I agree to the/i }));
    await userEvent.click(screen.getByRole('button', { name: /pay now/i }));

    await waitFor(() => expect(api.checkout).toHaveBeenCalled());
    const input = vi.mocked(api.checkout).mock.calls[0]![0];
    expect(input.email).toBe('buyer@example.com');
    expect(input.items).toEqual([{ productId: 'bb-151', quantity: 1 }]);
    expect(input.deliveryMethod).toBe('shipping');
    expect(input.shippingAddress?.city).toBe('Pallet');
    await waitFor(() => expect(assign).toHaveBeenCalledWith('/checkout/success?order_id=ord_1'));
  });

  it('submits a store-pickup order without a shipping address form', async () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, assign },
      writable: true,
    });
    useCartStore.setState({ deliveryMethod: 'pickup' });
    vi.spyOn(api, 'checkout').mockResolvedValue({
      url: '/checkout/success?order_id=ord_pickup',
      orderId: 'ord_pickup',
    });

    renderWithProviders(<CheckoutForm />);
    expect(screen.getByText(/Collect at our store/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Address')).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Email'), 'buyer@example.com');
    await userEvent.type(screen.getByLabelText('Full name'), 'Ash Ketchum');
    await userEvent.click(screen.getByRole('checkbox', { name: /I agree to the/i }));
    await userEvent.click(screen.getByRole('button', { name: /pay now/i }));

    await waitFor(() => expect(api.checkout).toHaveBeenCalled());
    const input = vi.mocked(api.checkout).mock.calls[0]![0];
    expect(input.deliveryMethod).toBe('pickup');
    expect(input.shippingAddress?.city).toBe('Båstad');
    expect(input.shippingAddress?.fullName).toBe('Ash Ketchum');
  });

  it('prompts guests to sign in', () => {
    renderWithProviders(<CheckoutForm />);
    expect(screen.getByText(/Checking out as a guest/i)).toBeInTheDocument();
  });
});
