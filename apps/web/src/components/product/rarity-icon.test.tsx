import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RarityIcon } from './rarity-icon';

describe('RarityIcon', () => {
  it('renders a circle for common', () => {
    const { container } = render(<RarityIcon rarity="common" />);
    expect(container.querySelector('circle')).toBeTruthy();
  });

  it('renders a diamond for uncommon', () => {
    const { container } = render(<RarityIcon rarity="uncommon" />);
    expect(container.querySelector('path')).toBeTruthy();
  });

  it('renders a star image for ultra rare', () => {
    const { container } = render(<RarityIcon rarity="ultra-rare" />);
    expect(container.querySelector('img')).toBeTruthy();
  });
});
