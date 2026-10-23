import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

/** Restricts child routes to authenticated admin users. */
export function AdminGuard() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
