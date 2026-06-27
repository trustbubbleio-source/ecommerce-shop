import type { LoginInput, RegisterInput } from '@akknerds/shared';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ApiError, api } from '../lib/api';
import { useAuthStore } from '../store/auth';

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (input: RegisterInput) => api.register(input),
    onSuccess: ({ token, user }) => setAuth(token, user),
  });
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (input: LoginInput) => api.login(input),
    onSuccess: ({ token, user }) => setAuth(token, user),
  });
}

/**
 * On mount, if a persisted token exists, refresh the current user. A 401 means
 * the token expired, so we log out cleanly.
 */
export function useInitAuth(): void {
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!token) return;
    let active = true;
    api
      .me()
      .then(({ user }) => {
        if (active) setUser(user);
      })
      .catch((error) => {
        if (active && error instanceof ApiError && error.status === 401) logout();
      });
    return () => {
      active = false;
    };
  }, [token, setUser, logout]);
}
