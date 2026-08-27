import { Card, CardContent, CardHeader, CardTitle, Button, Field, Input, Spinner, useToast } from '@akknerds/ui';
import { forgotPasswordInputSchema } from '@akknerds/shared';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api } from '@akknerds/api-client';

export function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = forgotPasswordInputSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter a valid email');
      return;
    }
    setError(undefined);
    setPending(true);
    try {
      const result = await api.forgotPassword(parsed.data);
      setDone(true);
      toast({ title: 'Check your inbox', description: result.message, variant: 'success' });
    } catch (err) {
      toast({
        title: 'Could not send reset email',
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
          <CardTitle className="text-2xl">Forgot password</CardTitle>
          <p className="text-muted-foreground text-sm">
            Enter your account email and we will send a reset link if it exists.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {done ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              If an account exists for that email, we sent password reset instructions. The link
              expires in one hour.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
              <Field label="Email" error={error} required>
                {(props) => (
                  <Input
                    {...props}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    placeholder="you@example.com"
                  />
                )}
              </Field>
              <Button type="submit" size="lg" block disabled={pending}>
                {pending && <Spinner className="text-primary-foreground" />}
                Send reset link
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
