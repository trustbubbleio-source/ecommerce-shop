import { resetPasswordInputSchema } from '@akknerds/shared';
import { Button, Card, CardContent, CardHeader, CardTitle, Field, Input, Spinner, useToast } from '@akknerds/ui';
import { type FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError, api } from '../lib/api';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get('token')?.trim() ?? '', [params]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrors({ password: 'Missing reset token. Request a new link from the login page.' });
      return;
    }
    if (password !== confirm) {
      setErrors({ confirm: 'Passwords do not match' });
      return;
    }
    const parsed = resetPasswordInputSchema.safeParse({ token, password });
    if (!parsed.success) {
      const next: { password?: string; confirm?: string } = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === 'password') next.password ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const result = await api.resetPassword(parsed.data);
      toast({ title: 'Password updated', description: result.message, variant: 'success' });
      navigate('/login', { replace: true });
    } catch (err) {
      toast({
        title: 'Could not reset password',
        description: err instanceof ApiError ? err.message : 'Please try again.',
        variant: 'error',
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="container flex justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Choose a new password</CardTitle>
          <p className="text-muted-foreground text-sm">
            Pick a new password for your One More Rip account.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {!token ? (
            <p className="text-muted-foreground text-sm">
              This reset link is missing or incomplete.{' '}
              <Link to="/forgot-password" className="text-primary font-semibold hover:underline">
                Request a new one
              </Link>
              .
            </p>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
              <Field label="New password" error={errors.password} hint="At least 8 characters" required>
                {(props) => (
                  <Input
                    {...props}
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                  />
                )}
              </Field>
              <Field label="Confirm password" error={errors.confirm} required>
                {(props) => (
                  <Input
                    {...props}
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(ev) => setConfirm(ev.target.value)}
                  />
                )}
              </Field>
              <Button type="submit" size="lg" block disabled={pending}>
                {pending && <Spinner className="text-primary-foreground" />}
                Update password
              </Button>
            </form>
          )}
          <p className="text-muted-foreground text-center text-sm">
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
