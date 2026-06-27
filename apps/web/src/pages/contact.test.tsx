import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../lib/api';
import { renderApp } from '../test/utils';

beforeEach(() => vi.restoreAllMocks());

describe('ContactPage', () => {
  it('validates the form', async () => {
    const spy = vi.spyOn(api, 'contact');
    renderApp('/contact');
    await userEvent.click(screen.getByRole('button', { name: /send message/i }));
    expect(await screen.findByText(/Name is required/i)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('submits a valid message and confirms success', async () => {
    vi.spyOn(api, 'contact').mockResolvedValue({ ok: true, message: 'Thanks!' });
    renderApp('/contact');
    await userEvent.type(screen.getByLabelText('Name'), 'Ash');
    await userEvent.type(screen.getByLabelText('Email'), 'ash@pallet.town');
    await userEvent.type(screen.getByLabelText('Subject'), 'Order question');
    await userEvent.type(
      screen.getByLabelText('Message'),
      'How long does shipping to Switzerland take?',
    );
    await userEvent.click(screen.getByRole('button', { name: /send message/i }));
    await waitFor(() => expect(screen.getByText(/Thanks for reaching out/i)).toBeInTheDocument());
  });
});
