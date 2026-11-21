import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PaymentMethods } from './payment-methods';

describe('PaymentMethods', () => {
  it('lists Google Pay instead of Klarna', () => {
    render(<PaymentMethods />);
    expect(screen.getByLabelText('Google Pay')).toBeInTheDocument();
    expect(screen.queryByLabelText('Klarna')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Visa')).toBeInTheDocument();
    expect(screen.getByLabelText('Mastercard')).toBeInTheDocument();
    expect(screen.getByLabelText('Apple Pay')).toBeInTheDocument();
  });
});
