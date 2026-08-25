import { Button, Card, CardContent } from '@akknerds/ui';
import { Link, useNavigate } from 'react-router-dom';
import { CurrencySwitcher } from '../../components/layout/currency-switcher';
import { useAuthStore } from '../../store/auth';

export function AccountSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-5 pt-6">
          <div>
            <p className="text-foreground text-sm font-semibold">Profile</p>
            <p className="text-muted-foreground mb-3 text-sm">
              Name, location, and collector details live on your profile page.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/account">Edit profile</Link>
            </Button>
          </div>

          <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <div>
              <p className="text-foreground text-sm font-semibold">Display currency</p>
              <p className="text-muted-foreground text-sm">
                Quick switch for browsing. Your saved preference is on the profile page.
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
