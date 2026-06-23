import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProjectRole } from '@planforge/shared';
import { projectApi } from '@/entities/project/api/project.api';
import { projectKeys } from '@/entities/project/hooks/use-projects';

/** Add / update-role / remove mutations for a project's member list. */
export function useProjectMemberMutations(projectId: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) });

  const addMember = useMutation({
    mutationFn: (input: { userId: string; role: ProjectRole }) =>
      projectApi.addMember(projectId, input),
    onSuccess: invalidate,
  });

  const updateRole = useMutation({
    mutationFn: (input: { userId: string; role: ProjectRole }) =>
      projectApi.updateMemberRole(projectId, input.userId, { role: input.role }),
    onSuccess: invalidate,
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => projectApi.removeMember(projectId, userId),
    onSuccess: invalidate,
  });

  return { addMember, updateRole, removeMember };
}
