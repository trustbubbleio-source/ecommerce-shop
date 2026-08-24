import type { PublicUser } from '@akknerds/shared';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { LocationProbe, renderWithProviders } from '../../test/utils';
import { AuthForm } from './auth-form';

const user: PublicUser = {
  id: 'usr_1',
  email: 'ash@pallet.town',
  name: 'Ash',
  role: 'customer',
  emailVerifiedAt: '2024-01-01T00:00:00.000Z',
  hasPassword: true,
  createdAt: '2024-01-01T00:00:00.000Z',
};

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null, mustSetPassword: false });
  vi.restoreAllMocks();
});

describe('AuthForm (login)', () => {
  it('validates required fields before calling the api', async () => {
    const spy = vi.spyOn(api, 'login');
    renderWithProviders(<AuthForm mode="login" />, { route: '/login' });
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('signs in and redirects on success', async () => {
    vi.spyOn(api, 'login').mockResolvedValue({ token: 'tok_1', user, mustSetPassword: false });
    renderWithProviders(
      <>
        <AuthForm mode="login" />
        <LocationProbe />
      </>,
      { route: '/login' },
    );
    await userEvent.type(screen.getByLabelText('Email'), 'ash@pallet.town');
    await userEvent.type(screen.getByLabelText('Password'), 'pikachu123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(useAuthStore.getState().token).toBe('tok_1'));
    expect(screen.getByTestId('location')).toHaveTextContent('/account');
  });

  it('shows a toast on api error', async () => {
    vi.spyOn(api, 'login').mockRejectedValue(new ApiError('Invalid email or password', 401));
    renderWithProviders(<AuthForm mode="login" />, { route: '/login' });
    await userEvent.type(screen.getByLabelText('Email'), 'ash@pallet.town');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Could not sign in')).toBeInTheDocument();
  });
});

describe('AuthForm (register)', () => {
  it('requires an email and asks the user to check their inbox', async () => {
    const registerSpy = vi.spyOn(api, 'register').mockResolvedValue({
      ok: true,
      message: 'Check your inbox',
    });
    renderWithProviders(<AuthForm mode="register" />, { route: '/register' });

    await userEvent.click(screen.getByRole('button', { name: 'Continue with email' }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Email'), 'ash@pallet.town');
    await userEvent.click(screen.getByRole('button', { name: 'Continue with email' }));

    await waitFor(() => expect(registerSpy).toHaveBeenCalledWith({ email: 'ash@pallet.town' }));
    expect(useAuthStore.getState().user).toBeNull();
    expect(await screen.findByText(/We sent a confirmation link/i)).toBeInTheDocument();
  });
});
