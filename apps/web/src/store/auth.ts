import type { PublicUser } from '@akknerds/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAuthToken } from '@akknerds/api-client';

interface AuthState {
  token: string | null;
  user: PublicUser | null;
  /** Prompt the set-password modal after email verification (or Google without password). */
  mustSetPassword: boolean;
  setAuth: (token: string, user: PublicUser, opts?: { mustSetPassword?: boolean }) => void;
  setUser: (user: PublicUser) => void;
  clearMustSetPassword: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      mustSetPassword: false,
      setAuth: (token, user, opts) => {
        setAuthToken(token);
        set({
          token,
          user,
          mustSetPassword: opts?.mustSetPassword ?? false,
        });
      },
      setUser: (user) =>
        set((state) => ({
          user,
          mustSetPassword: user.hasPassword ? false : state.mustSetPassword,
        })),
      clearMustSetPassword: () => set({ mustSetPassword: false }),
      logout: () => {
        setAuthToken(null);
        set({ token: null, user: null, mustSetPassword: false });
      },
    }),
    {
      name: 'onemorerip-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        mustSetPassword: state.mustSetPassword,
      }),
      onRehydrateStorage: () => (state) => {
        setAuthToken(state?.token ?? null);
      },
    },
  ),
);

useAuthStore.subscribe((state) => {
  setAuthToken(state.token);
});
