import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useChatStore } from '../../store/chat';
import { renderWithProviders } from '../../test/utils';
import { ChatWidget } from './chat-widget';

describe('ChatWidget', () => {
  beforeEach(() => {
    useChatStore.setState({ open: false, messages: [], pending: false });
  });

  it('opens and answers a Shipping chip', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChatWidget />);

    await user.click(screen.getByRole('button', { name: 'Open chat help' }));

    expect(await screen.findByRole('dialog', { name: /help/i })).toBeInTheDocument();
    expect(screen.getByText(/Welcome to One More Rip/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Shipping times' }));

    await waitFor(() => {
      expect(screen.getByText(/dispatched the same day/i)).toBeInTheDocument();
    });
  });
});
