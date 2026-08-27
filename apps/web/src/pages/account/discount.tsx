import {
  findDiscountCode,
  isManualDiscountAllowed,
  isWelcomeDiscountCode,
  updateProfileInputSchema,
} from '@akknerds/shared';
import { Alert, Button, Card, CardContent, Field, Input, Spinner, useToast } from '@akknerds/ui';
import { TicketPercent } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { ApiError } from '@akknerds/api-client';
import { useUpdateProfile } from '../../hooks/use-auth';
import { useAuthStore } from '../../store/auth';

export function AccountDiscountPage() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const current = user?.profile.discountCode ?? '';
    // Don't surface auto-assigned welcome codes in the input (not shareable).
    setCode(isWelcomeDiscountCode(current) ? '' : current);
  }, [user?.profile.discountCode]);

  if (!user) return null;

  const saved = findDiscountCode(user.profile.discountCode);
  const welcomeActive = isWelcomeDiscountCode(user.profile.discountCode);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = updateProfileInputSchema.safeParse({ discountCode: code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid code');
      return;
    }

    const nextCode = parsed.data.discountCode ?? null;
    if (nextCode != null && !findDiscountCode(nextCode)) {
      setError('That discount code is not valid.');
      return;
    }
    if (nextCode != null && !isManualDiscountAllowed(nextCode)) {
      setError('That welcome offer is applied automatically for new accounts only.');
      return;
    }

    try {
      await updateProfile.mutateAsync({ discountCode: nextCode });
      toast({
        title: nextCode ? 'Discount saved' : 'Discount cleared',
        description: nextCode
          ? `${nextCode} will apply automatically at checkout.`
          : 'No promo code on your account.',
        variant: 'success',
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save that code.');
    }
  };

  const onClear = async () => {
    setError(null);
    try {
      await updateProfile.mutateAsync({ discountCode: null });
      setCode('');
      toast({
        title: 'Discount cleared',
        description: 'No promo code on your account.',
        variant: 'success',
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not clear that code.');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-5 pt-6">
          <div className="flex items-start gap-3">
            <div className="bg-secondary text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
              <TicketPercent className="size-5" />
            </div>
            <div>
              <p className="text-foreground text-sm font-semibold">Discount code</p>
              <p className="text-muted-foreground text-sm">
                Got a promo from us? Save it here and we&apos;ll apply it automatically when you
                check out.
              </p>
            </div>
          </div>

          {welcomeActive && saved && (
            <Alert variant="success">
              Welcome offer active: {saved.label}. Applies once on your first paid order.
            </Alert>
          )}
          {saved && !welcomeActive && (
            <Alert variant="success">
              Active: <span className="font-semibold">{saved.code}</span> — {saved.label}
            </Alert>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <Field label="Code" error={error ?? undefined}>
              {(props) => (
                <Input
                  {...props}
                  name="discountCode"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter a promo code"
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono uppercase tracking-wide"
                />
              )}
            </Field>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending && <Spinner className="text-primary-foreground" />}
                Save code
              </Button>
              {user.profile.discountCode && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={updateProfile.isPending}
                  onClick={onClear}
                >
                  Remove
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
