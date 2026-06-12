import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { CreateInvitationInput } from '@planforge/shared';
import { CURRENT_ORGANIZATION_KEY } from '@/entities/organization/hooks/use-current-organization';
import { organizationApi } from '@/entities/organization/api/organization.api';
import { invitationApi } from '@/features/invitation/api/invitation.api';

interface CreateOrganizationPayload {
  name: string;
  invitations: CreateInvitationInput[];
}

/**
 * Creates the organization, then best-effort sends the optional invitations.
 * A failed invitation must not block onboarding — the org already exists.
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ name, invitations }: CreateOrganizationPayload) => {
      const organization = await organizationApi.create({ name });
      const results = await Promise.allSettled(invitations.map((i) => invitationApi.create(i)));
      const failed = results.filter((r) => r.status === 'rejected').length;
      return { organization, failedInvitations: failed };
    },
    onSuccess: ({ organization }) => {
      queryClient.setQueryData(CURRENT_ORGANIZATION_KEY, organization);
      navigate('/', { replace: true });
    },
  });
}
