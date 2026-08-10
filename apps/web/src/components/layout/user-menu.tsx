import { Button } from '@akknerds/ui';
import { LogIn, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

export function UserMenu() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return (
      <Button asChild variant="ghost" size="icon" aria-label="Sign in">
        <Link to="/login">
          <LogIn />
        </Link>
      </Button>
    );
  }

  const firstName = user.name.split(' ')[0];
  return (
    <div className="flex items-center gap-1">
      {user.role === 'admin' && (
        <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
          <Link to="/admin">Admin</Link>
        </Button>
      )}
      <Button asChild variant="ghost" size="sm" aria-label="Your account">
        <Link to="/account" className="gap-2">
          <User className="size-4" />
          <span className="hidden max-w-24 truncate sm:inline">{firstName}</span>
        </Link>
      </Button>
    </div>
  );
}
