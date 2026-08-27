import { Button, Card, CardContent, CardHeader, CardTitle, Spinner } from '@akknerds/ui';
import { useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '@akknerds/api-client';
import { useVerifyEmail } from '../hooks/use-auth';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get('token')?.trim() ?? '', [params]);
  const navigate = useNavigate();
  const verify = useVerifyEmail();
  const started = useRef(false);
  const { mutateAsync, isError, error, isPending, isSuccess } = verify;

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    void mutateAsync({ token })
      .then(() => {
        navigate('/account', { replace: true });
      })
      .catch(() => {
        // Error UI rendered below from mutation state.
      });
  }, [token, mutateAsync, navigate]);

  const errorMessage =
    error instanceof ApiError
      ? error.message
      : isError
        ? 'This confirmation link is invalid or has expired.'
        : undefined;

  return (
    <div className="container flex justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Confirming your email</CardTitle>
          <p className="text-muted-foreground text-sm">
            Hang tight — we&apos;re verifying your account and signing you in.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!token ? (
            <p className="text-muted-foreground text-sm">
              This confirmation link is missing or incomplete.{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Create an account
              </Link>{' '}
              again to get a new link.
            </p>
          ) : errorMessage ? (
            <>
              <p className="text-muted-foreground text-sm">{errorMessage}</p>
              <Button asChild variant="outline">
                <Link to="/register">Create account again</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/login">Back to sign in</Link>
              </Button>
            </>
          ) : (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Spinner />
              {isSuccess ? 'Signed in — redirecting…' : isPending || token ? 'Confirming…' : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
