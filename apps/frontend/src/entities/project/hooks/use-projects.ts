import { useQuery } from '@tanstack/react-query';
import { projectApi } from '../api/project.api';

export const projectKeys = {
  bySpace: (spaceId: string) => ['spaces', spaceId, 'projects'] as const,
  detail: (projectId: string) => ['projects', projectId] as const,
  members: (projectId: string) => ['projects', projectId, 'members'] as const,
};

export function useSpaceProjects(spaceId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: projectKeys.bySpace(spaceId ?? ''),
    queryFn: () => projectApi.listBySpace(spaceId!),
    enabled: Boolean(spaceId) && enabled,
  });
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(projectId ?? ''),
    queryFn: () => projectApi.getById(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useProjectMembers(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.members(projectId ?? ''),
    queryFn: () => projectApi.listMembers(projectId!),
    enabled: Boolean(projectId),
  });
}
