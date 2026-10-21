import { ApiError, api } from '@akknerds/api-client';
import { Button, Card, CardContent, Spinner } from '@akknerds/ui';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/common/empty-state';
import { usePageTitle } from '../hooks/use-page-title';

export function NewsletterUnsubscribePage() {
  usePageTitle('Unsubscribe');
  const [params] = useSearchParams();
  const token = useMemo(() => params.get('token')?.trim() ?? '', [params]);
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [message, setMessage] = useState('Unsubscribing…');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing unsubscribe link. Use the link from your email.');
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const result = await api.unsubscribeNewsletter({ token });
        if (cancelled) return;
        setStatus('done');
        setMessage(result.message);
      } catch (error) {
        if (cancelled) return;
        setStatus('error');
        setMessage(error instanceof ApiError ? error.message : 'Could not unsubscribe. Try again.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="container flex justify-center py-24">
        <Spinner className="size-8" label="Unsubscribing" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container py-16">
        <EmptyState
          title="Could not unsubscribe"
          description={message}
          action={
            <Button asChild variant="outline">
              <Link to="/">Back home</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container max-w-lg py-16">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">Unsubscribe</h1>
          <p className="text-muted-foreground text-sm">{message}</p>
          <Button asChild className="self-center">
            <Link to="/shop">Continue shopping</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
