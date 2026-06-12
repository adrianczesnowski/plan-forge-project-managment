import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CURRENT_ORGANIZATION_KEY } from '@/entities/organization/hooks/use-current-organization';
import { useAuthStore } from '@/stores/auth.store';
import { invitationApi } from '../api/invitation.api';

export const PENDING_INVITATIONS_KEY = ['invitations', 'pending'] as const;

export function usePendingInvitations() {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: PENDING_INVITATIONS_KEY,
    queryFn: invitationApi.listPending,
    enabled: status === 'authenticated',
  });
}

/** Accepting an invitation resolves the user's organization → go straight to the app. */
export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: invitationApi.accept,
    onSuccess: (organization) => {
      queryClient.setQueryData(CURRENT_ORGANIZATION_KEY, organization);
      navigate('/', { replace: true });
    },
  });
}

export function useRejectInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invitationApi.reject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PENDING_INVITATIONS_KEY }),
  });
}
