import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SpaceRole } from '@planforge/shared';
import { spaceApi } from '@/entities/space/api/space.api';
import { spaceMemberKeys } from '@/entities/space/hooks/use-spaces';

/** Add / update-role / remove mutations for a space's member list. */
export function useSpaceMemberMutations(spaceId: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: spaceMemberKeys.members(spaceId) });

  const addMember = useMutation({
    mutationFn: (input: { userId: string; role: SpaceRole }) =>
      spaceApi.addMember(spaceId, input),
    onSuccess: invalidate,
  });

  const updateRole = useMutation({
    mutationFn: (input: { userId: string; role: SpaceRole }) =>
      spaceApi.updateMemberRole(spaceId, input.userId, { role: input.role }),
    onSuccess: invalidate,
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => spaceApi.removeMember(spaceId, userId),
    onSuccess: invalidate,
  });

  return { addMember, updateRole, removeMember };
}
