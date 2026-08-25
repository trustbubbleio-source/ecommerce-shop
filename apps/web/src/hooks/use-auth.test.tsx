import type { PublicUser } from '@akknerds/shared';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { useInitAuth } from './use-auth';

const user: PublicUser = {
  id: 'usr_1',
  email: 'ash@pallet.town',
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
};

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null, mustSetPassword: false });
  vi.restoreAllMocks();
});

describe('useInitAuth', () => {
  it('does nothing without a token', () => {
    const spy = vi.spyOn(api, 'me');
    renderHook(() => useInitAuth());
    expect(spy).not.toHaveBeenCalled();
  });

  it('refreshes the user when a token is present', async () => {
    useAuthStore.setState({ token: 'tok_1', user: null });
    vi.spyOn(api, 'me').mockResolvedValue({ user });
    renderHook(() => useInitAuth());
    await waitFor(() => expect(useAuthStore.getState().user).toEqual(user));
  });

  it('logs out on a 401', async () => {
    useAuthStore.setState({ token: 'expired', user });
    vi.spyOn(api, 'me').mockRejectedValue(new ApiError('Authentication required', 401));
    renderHook(() => useInitAuth());
    await waitFor(() => expect(useAuthStore.getState().token).toBeNull());
  });
});
