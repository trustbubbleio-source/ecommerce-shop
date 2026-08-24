import type { LoginInput, RegisterInput, VerifyEmailInput } from '@akknerds/shared';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ApiError, api } from '../lib/api';
import { useAuthStore } from '../store/auth';

export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) => api.register(input),
  });
}

export function useVerifyEmail() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (input: VerifyEmailInput) => api.verifyEmail(input),
    onSuccess: (data) => setAuth(data.token, data.user, { mustSetPassword: data.mustSetPassword }),
  });
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (input: LoginInput) => api.login(input),
    onSuccess: (data) => setAuth(data.token, data.user, { mustSetPassword: data.mustSetPassword }),
  });
}

export function useGoogleAuth() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (idToken: string) => api.googleAuth({ idToken }),
    onSuccess: (data) => setAuth(data.token, data.user, { mustSetPassword: data.mustSetPassword }),
  });
}

export function useSetPassword() {
  const setUser = useAuthStore((s) => s.setUser);
  const clearMustSetPassword = useAuthStore((s) => s.clearMustSetPassword);
  return useMutation({
    mutationFn: (password: string) => api.setPassword({ password }),
    onSuccess: ({ user }) => {
      setUser(user);
      clearMustSetPassword();
    },
  });
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (name: string) => api.updateProfile({ name }),
    onSuccess: ({ user }) => setUser(user),
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
        if (active && error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          logout();
        }
      });
    return () => {
      active = false;
    };
  }, [token, setUser, logout]);
}
