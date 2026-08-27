import { loginInputSchema, registerInputSchema } from '@akknerds/shared';
import { Button, Field, Input, Spinner, useToast } from '@akknerds/ui';
import { type FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { ZodError } from 'zod';
import { ApiError } from '@akknerds/api-client';
import { useLogin, useRegister } from '../../hooks/use-auth';
import { GoogleSignInButton } from './google-sign-in-button';

type FieldName = 'email' | 'password';
type Errors = Partial<Record<FieldName, string>>;

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/account';
  const prefillEmail = (location.state as { email?: string } | null)?.email ?? '';

  const register = useRegister();
  const login = useLogin();
  const { toast } = useToast();

  const [values, setValues] = useState({ email: prefillEmail, password: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [checkEmail, setCheckEmail] = useState<string>();

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
      const parsed = registerInputSchema.safeParse({ email: values.email });
      if (!parsed.success) return applyZodErrors(parsed.error);
      setErrors({});
      try {
        const result = await register.mutateAsync(parsed.data);
        setCheckEmail(parsed.data.email);
        toast({ title: 'Check your inbox', description: result.message, variant: 'success' });
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

  if (isRegister && checkEmail) {
    return (
      <div className="flex flex-col gap-4 text-sm">
        <p className="text-foreground leading-relaxed">
          We sent a confirmation link to <span className="font-semibold">{checkEmail}</span>. Open
          it to verify your email, then choose a password.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          The link expires in 24 hours. Didn&apos;t get it? Check spam, or{' '}
          <button
            type="button"
            className="text-primary font-semibold hover:underline"
            onClick={() => setCheckEmail(undefined)}
          >
            try again
          </button>
          .
        </p>
        <p className="text-muted-foreground text-center">
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <GoogleSignInButton redirectTo={from} />
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
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
        {!isRegister && (
          <Field label="Password" error={errors.password} required>
            {(props) => (
              <Input
                {...props}
                type="password"
                autoComplete="current-password"
                value={values.password}
                onChange={set('password')}
              />
            )}
          </Field>
        )}

        <Button type="submit" size="lg" block disabled={pending}>
          {pending && <Spinner className="text-primary-foreground" />}
          {isRegister ? 'Continue with email' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
