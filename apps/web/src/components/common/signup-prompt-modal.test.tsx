import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../../store/auth';
import { SignupPromptModal } from './signup-prompt-modal';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  localStorage.clear();
  useAuthStore.setState({ token: null, user: null, mustSetPassword: false });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function renderModal(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SignupPromptModal />
    </MemoryRouter>,
  );
}

describe('SignupPromptModal', () => {
  it('opens for guests after 15 seconds', async () => {
    renderModal();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    expect(screen.getByRole('heading', { name: /Receive 10% off/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Claim 10% off/i })).toBeInTheDocument();
    expect(screen.queryByText(/ONEMORERIP10/)).not.toBeInTheDocument();
  });

  it('does not open when signed in', async () => {
    useAuthStore.setState({
      token: 'tok',
      user: {
        id: 'u1',
        email: 'a@b.com',
        name: 'Ash',
        role: 'customer',
        emailVerifiedAt: '2024-01-01T00:00:00.000Z',
        hasPassword: true,
        profile: {
          phone: null,
          country: null,
          city: null,
          bio: null,
          shippingAddress: null,
          discountCode: null,
          preferredCurrency: 'eur',
          marketingOptIn: false,
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    });

    renderModal();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not open on auth routes', async () => {
    renderModal('/register');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('remembers dismiss and stays closed', async () => {
    const click = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderModal();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    await click.click(screen.getByRole('button', { name: 'Not now' }));
    expect(localStorage.getItem('omr-signup-prompt')).toBe('1');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
