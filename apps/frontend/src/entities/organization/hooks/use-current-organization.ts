import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { organizationApi } from '../api/organization.api';

export const CURRENT_ORGANIZATION_KEY = ['organization', 'current'] as const;

/** The single organization of the logged-in user (null → onboarding). */
export function useCurrentOrganization() {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: CURRENT_ORGANIZATION_KEY,
    queryFn: organizationApi.getCurrent,
    enabled: status === 'authenticated',
    staleTime: 5 * 60_000,
  });
}
