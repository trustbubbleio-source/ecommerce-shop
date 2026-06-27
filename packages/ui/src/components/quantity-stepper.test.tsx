import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QuantityStepper } from './quantity-stepper.js';

describe('QuantityStepper', () => {
  it('increments and decrements within bounds', async () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={2} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Increase quantity'));
    expect(onChange).toHaveBeenCalledWith(3);
    await userEvent.click(screen.getByLabelText('Decrease quantity'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('disables decrement at the minimum', () => {
    render(<QuantityStepper value={1} min={1} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Decrease quantity')).toBeDisabled();
  });

  it('disables increment at the maximum', () => {
    render(<QuantityStepper value={5} max={5} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Increase quantity')).toBeDisabled();
  });

  it('clamps typed values to the max', async () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={1} max={9} onChange={onChange} />);
    const input = screen.getByRole('spinbutton', { name: 'Quantity' });
    await userEvent.clear(input);
    await userEvent.type(input, '50');
    expect(onChange).toHaveBeenLastCalledWith(9);
  });

  it('falls back to the minimum for empty input', async () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={3} min={1} onChange={onChange} />);
    const input = screen.getByRole('spinbutton', { name: 'Quantity' });
    await userEvent.clear(input);
    expect(onChange).toHaveBeenLastCalledWith(1);
  });
});
