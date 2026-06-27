import { loginInputSchema, registerInputSchema } from '@akknerds/shared';
import { Button, Field, Input, Spinner, useToast } from '@akknerds/ui';
import { type FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ZodError } from 'zod';
import { ApiError } from '../../lib/api';
import { useLogin, useRegister } from '../../hooks/use-auth';

type FieldName = 'name' | 'email' | 'password';
type Errors = Partial<Record<FieldName, string>>;

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/account';

  const register = useRegister();
  const login = useLogin();
  const { toast } = useToast();

  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Errors>({});

  const set = (key: FieldName) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const applyZodErrors = (error: ZodError) => {
    const next: Errors = {};
    for (const issue of error.issues) {
      const key = issue.path[0] as FieldName;
      next[key] ??= issue.message;
    }
    setErrors(next);
  };

  const onError = (error: unknown) => {
    toast({
      title: isRegister ? 'Could not create account' : 'Could not sign in',
      description: error instanceof ApiError ? error.message : 'Please try again.',
      variant: 'error',
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      const parsed = registerInputSchema.safeParse(values);
      if (!parsed.success) return applyZodErrors(parsed.error);
      setErrors({});
      try {
        await register.mutateAsync(parsed.data);
        navigate(from, { replace: true });
      } catch (error) {
        onError(error);
      }
    } else {
      const parsed = loginInputSchema.safeParse({ email: values.email, password: values.password });
      if (!parsed.success) return applyZodErrors(parsed.error);
      setErrors({});
      try {
        await login.mutateAsync(parsed.data);
        navigate(from, { replace: true });
      } catch (error) {
        onError(error);
      }
    }
  };

  const pending = isRegister ? register.isPending : login.isPending;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {isRegister && (
        <Field label="Name" error={errors.name} required>
          {(props) => (
            <Input {...props} autoComplete="name" value={values.name} onChange={set('name')} />
          )}
        </Field>
      )}
      <Field label="Email" error={errors.email} required>
        {(props) => (
          <Input
            {...props}
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={set('email')}
            placeholder="you@example.com"
          />
        )}
      </Field>
      <Field
        label="Password"
        error={errors.password}
        hint={isRegister ? 'At least 8 characters' : undefined}
        required
      >
        {(props) => (
          <Input
            {...props}
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={values.password}
            onChange={set('password')}
          />
        )}
      </Field>

      <Button type="submit" size="lg" block disabled={pending}>
        {pending && <Spinner className="text-primary-foreground" />}
        {isRegister ? 'Create account' : 'Sign in'}
      </Button>
    </form>
  );
}
