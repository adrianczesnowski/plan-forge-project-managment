import { useQuery } from '@tanstack/react-query';
import { dependencyApi } from '../api/dependency.api';

export const dependencyKeys = {
  byProject: (projectId: string) => ['projects', projectId, 'dependencies'] as const,
  byTask: (taskId: string) => ['tasks', taskId, 'dependencies'] as const,
};

export function useProjectDependencies(projectId: string | undefined) {
  return useQuery({
    queryKey: dependencyKeys.byProject(projectId ?? ''),
    queryFn: () => dependencyApi.listByProject(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useTaskDependencies(taskId: string | undefined) {
  return useQuery({
    queryKey: dependencyKeys.byTask(taskId ?? ''),
    queryFn: () => dependencyApi.listByTask(taskId!),
    enabled: Boolean(taskId),
  });
}
