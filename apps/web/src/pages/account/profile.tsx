import { Button, Card, CardContent } from '@akknerds/ui';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

export function AccountProfilePage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Name</p>
            <p className="text-foreground text-base font-semibold">{user.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Email</p>
            <p className="text-foreground text-base font-semibold">{user.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Member since
            </p>
            <p className="text-foreground text-base font-semibold">{memberSince}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link to="/account/orders">View orders</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/account/settings">Account settings</Link>
        </Button>
      </div>
    </div>
  );
}
