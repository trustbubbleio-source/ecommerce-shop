import type { PublicUser } from '@akknerds/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '../lib/api';
import { useAuthStore } from './auth';

const user: PublicUser = {
  id: 'usr_1',
  email: 'ash@pallet.town',
  name: 'Ash Ketchum',
  role: 'customer',
  createdAt: '2024-01-01T00:00:00.000Z',
};

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null });
  vi.restoreAllMocks();
});

describe('auth store', () => {
  it('sets auth and syncs the token to the api client', () => {
    const spy = vi.spyOn(apiModule, 'setAuthToken');
    useAuthStore.getState().setAuth('tok_123', user);
    expect(useAuthStore.getState().token).toBe('tok_123');
    expect(useAuthStore.getState().user).toEqual(user);
    expect(spy).toHaveBeenCalledWith('tok_123');
  });

  it('updates the user without touching the token', () => {
    useAuthStore.getState().setAuth('tok_123', user);
    useAuthStore.getState().setUser({ ...user, name: 'Red' });
    expect(useAuthStore.getState().user?.name).toBe('Red');
    expect(useAuthStore.getState().token).toBe('tok_123');
  });

  it('clears auth and the api token on logout', () => {
    const spy = vi.spyOn(apiModule, 'setAuthToken');
    useAuthStore.getState().setAuth('tok_123', user);
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(spy).toHaveBeenLastCalledWith(null);
  });
});
