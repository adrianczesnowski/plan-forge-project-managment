import { useQuery } from '@tanstack/react-query';
import { organizationApi } from '../api/organization.api';

export const organizationMemberKeys = {
  members: (orgId: string) => ['organization', orgId, 'members'] as const,
};

/** All members of an organization — used as the candidate pool when adding people to spaces. */
export function useOrganizationMembers(orgId: string | undefined) {
  return useQuery({
    queryKey: organizationMemberKeys.members(orgId ?? ''),
    queryFn: () => organizationApi.listMembers(orgId!),
    enabled: Boolean(orgId),
  });
}
