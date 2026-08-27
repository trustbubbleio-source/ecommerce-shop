import type { LoginInput, RegisterInput, UpdateProfileInput, VerifyEmailInput } from '@akknerds/shared';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ApiError, api } from '@akknerds/api-client';
import { useAuthStore } from '../store/auth';
import { useCurrencyStore } from '../store/currency';

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
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => api.updateProfile(input),
    onSuccess: ({ user }) => {
      setUser(user);
      setCurrency(user.profile.preferredCurrency);
    },
  });
}

/**
 * On mount, if a persisted token exists, refresh the current user. A 401 means
 * the token expired, so we log out cleanly. Also sync preferred currency.
 */
export function useInitAuth(): void {
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!token) return;
    let active = true;
    api
      .me()
      .then(({ user }) => {
        if (!active) return;
        setUser(user);
        setCurrency(user.profile.preferredCurrency);
      })
      .catch((error) => {
        if (active && error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          logout();
        }
      });
    return () => {
      active = false;
    };
  }, [token, setUser, setCurrency, logout]);
}
