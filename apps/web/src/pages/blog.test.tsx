import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/utils';

describe('BlogPage', () => {
  it('lists the blog articles', async () => {
    renderApp('/blog');
    expect(await screen.findByRole('heading', { name: 'Blog', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Who are we?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How we are packing' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Controls of quality' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Why we love Pokémon' })).toBeInTheDocument();
  });

  it('opens an article from the list', async () => {
    renderApp('/blog');
    await userEvent.click(await screen.findByRole('link', { name: /how we are packing/i }));
    expect(
      await screen.findByRole('heading', { name: 'How we are packing', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/protection first/i)).toBeInTheDocument();
  });

  it('shows a not-found state for an unknown article', async () => {
    renderApp('/blog/does-not-exist');
    expect(await screen.findByRole('heading', { name: /article not found/i })).toBeInTheDocument();
  });
});
