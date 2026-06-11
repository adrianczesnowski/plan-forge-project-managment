import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { FullPageSpinner } from '@/shared/ui/full-page-spinner';

/** Renders child routes (login/register) only for guests; authenticated users go home. */
export function GuestRoute() {
  const status = useAuthStore((s) => s.status);

  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return <Outlet />;
}
