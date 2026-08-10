import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/utils';

describe('FaqPage', () => {
  it('renders sections and expands an answer', async () => {
    renderApp('/faq');
    expect(await screen.findByRole('heading', { name: 'FAQ' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Shipping & delivery' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Payments' })).toBeInTheDocument();

    const paymentButton = screen.getByRole('button', {
      name: 'What payment methods do you accept?',
    });
    expect(paymentButton).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(paymentButton);
    expect(paymentButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Stripe/i)).toBeInTheDocument();
  });

  it('links to the contact page', async () => {
    renderApp('/faq');
    expect(await screen.findByRole('link', { name: /contact us/i })).toHaveAttribute(
      'href',
      '/contact',
    );
  });
});
