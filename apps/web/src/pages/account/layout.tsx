import { cn } from '@akknerds/ui';
import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { PageHeader } from '../../components/common/page-header';
import { ACCOUNT_NAV } from '../../config/account';
import { useAuthStore } from '../../store/auth';

export function AccountLayout() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/login" state={{ from: '/account' }} replace />;
  }

  return (
    <div className="container max-w-3xl py-8">
      <PageHeader
        title={`Hi, ${user.name.split(' ')[0]}`}
        description="Manage your profile, orders, and account settings."
      />

      <nav
        aria-label="Account"
        className="border-border mb-8 flex gap-1 overflow-x-auto border-b pb-px"
      >
        {ACCOUNT_NAV.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/account'}
            className={({ isActive }) =>
              cn(
                'shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground border-transparent',
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
