import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { FullPageSpinner } from '@/shared/ui/full-page-spinner';

/** Renders child routes only for authenticated users; otherwise redirects to /login. */
export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status);

  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  return <Outlet />;
}
