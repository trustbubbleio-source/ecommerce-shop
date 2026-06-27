import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Rating } from './rating.js';

describe('Rating', () => {
  it('exposes an accessible label', () => {
    render(<Rating value={4} />);
    expect(screen.getByLabelText('Rated 4 out of 5')).toBeInTheDocument();
  });

  it('clamps values above the max', () => {
    render(<Rating value={9} max={5} />);
    expect(screen.getByLabelText('Rated 5 out of 5')).toBeInTheDocument();
  });

  it('clamps negative values to zero', () => {
    render(<Rating value={-2} />);
    expect(screen.getByLabelText('Rated 0 out of 5')).toBeInTheDocument();
  });

  it('renders a review count when provided', () => {
    render(<Rating value={4.5} reviewCount={128} />);
    expect(screen.getByText('(128)')).toBeInTheDocument();
  });
});
