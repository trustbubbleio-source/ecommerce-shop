import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { api } from './lib/api';

beforeEach(() => vi.restoreAllMocks());

describe('App', () => {
  it('mounts the router with providers and renders the home page', async () => {
    vi.spyOn(api, 'listProducts').mockResolvedValue({ products: [], total: 0 });
    render(<App />);
    expect(await screen.findByRole('heading', { name: /Catch the/i })).toBeInTheDocument();
  });
});
