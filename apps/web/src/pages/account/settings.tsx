import { updateProfileInputSchema } from '@akknerds/shared';
import { Button, Card, CardContent, Field, Input, Spinner, useToast } from '@akknerds/ui';
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CurrencySwitcher } from '../../components/layout/currency-switcher';
import { ApiError } from '../../lib/api';
import { useUpdateProfile } from '../../hooks/use-auth';
import { useAuthStore } from '../../store/auth';

export function AccountSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [nameError, setNameError] = useState<string>();

  if (!user) return null;

  const onSaveName = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = updateProfileInputSchema.safeParse({ name });
    if (!parsed.success) {
      setNameError(parsed.error.issues[0]?.message ?? 'Invalid name');
      return;
    }
    setNameError(undefined);
    try {
      await updateProfile.mutateAsync(parsed.data.name);
      toast({ title: 'Profile updated', variant: 'success' });
    } catch (err) {
      toast({
        title: 'Could not update name',
        description: err instanceof ApiError ? err.message : 'Please try again.',
        variant: 'error',
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-5 pt-6">
          <form onSubmit={onSaveName} className="flex flex-col gap-3">
            <div>
              <p className="text-foreground text-sm font-semibold">Display name</p>
              <p className="text-muted-foreground mb-3 text-sm">
                Optional — used in your account. Shipping name is collected at checkout.
              </p>
            </div>
            <Field label="Name" error={nameError}>
              {(props) => (
                <Input
                  {...props}
                  value={name}
                  onChange={(ev) => setName(ev.target.value)}
                  autoComplete="name"
                />
              )}
            </Field>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="self-start"
              disabled={updateProfile.isPending || name.trim() === user.name}
            >
              {updateProfile.isPending && <Spinner />}
              Save name
            </Button>
          </form>

          <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <div>
              <p className="text-foreground text-sm font-semibold">Display currency</p>
              <p className="text-muted-foreground text-sm">
                Prices on the site update instantly. Checkout charges in the currency you pick.
              </p>
            </div>
            <CurrencySwitcher />
          </div>

          <div className="border-border border-t pt-5">
            <p className="text-foreground text-sm font-semibold">Password</p>
            <p className="text-muted-foreground mb-3 text-sm">
              {user.hasPassword
                ? 'We email you a secure link to choose a new password.'
                : 'No password yet — use Forgot password or set one after email signup.'}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/forgot-password">
                {user.hasPassword ? 'Reset password' : 'Set a password'}
              </Link>
            </Button>
          </div>

          <div className="border-border border-t pt-5">
            <p className="text-foreground text-sm font-semibold">Sign out</p>
            <p className="text-muted-foreground mb-3 text-sm">
              Signed in as {user.email}. You can sign back in anytime.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
