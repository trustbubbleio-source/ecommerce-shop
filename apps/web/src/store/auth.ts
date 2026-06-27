import type { PublicUser } from '@akknerds/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAuthToken } from '../lib/api';

interface AuthState {
  token: string | null;
  user: PublicUser | null;
  setAuth: (token: string, user: PublicUser) => void;
  setUser: (user: PublicUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        setAuthToken(token);
        set({ token, user });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        setAuthToken(null);
        set({ token: null, user: null });
      },
    }),
    {
      name: 'akknerds-auth',
      // Re-attach the persisted token to the API client after rehydration.
      onRehydrateStorage: () => (state) => {
        if (state?.token) setAuthToken(state.token);
      },
    },
  ),
);
