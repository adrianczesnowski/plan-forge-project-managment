import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentOrganization } from '@/entities/organization/hooks/use-current-organization';
import { FullPageSpinner } from '@/shared/ui/full-page-spinner';

/** App routes require an organization; users without one go through onboarding first. */
export function RequireOrganization() {
  const { data: organization, isPending } = useCurrentOrganization();

  if (isPending) return <FullPageSpinner />;
  if (!organization) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}
