import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateOrganizationMemberInput } from '@planforge/shared';
import { organizationApi } from '@/entities/organization/api/organization.api';
import { organizationMemberKeys } from '@/entities/organization/hooks/use-organization-members';

type AssignableOrgRole = UpdateOrganizationMemberInput['role'];

/** Update-role / remove mutations for an organization's member list. */
export function useOrganizationMemberMutations(orgId: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: organizationMemberKeys.members(orgId) });

  const updateRole = useMutation({
    mutationFn: (input: { userId: string; role: AssignableOrgRole }) =>
      organizationApi.updateMemberRole(orgId, input.userId, { role: input.role }),
    onSuccess: invalidate,
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => organizationApi.removeMember(orgId, userId),
    onSuccess: invalidate,
  });

  return { updateRole, removeMember };
}
