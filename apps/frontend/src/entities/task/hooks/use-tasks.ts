import { useQuery } from '@tanstack/react-query';
import { taskApi } from '../api/task.api';

export const taskKeys = {
  tree: (projectId: string) => ['projects', projectId, 'tasks'] as const,
  detail: (taskId: string) => ['tasks', taskId] as const,
};

export function useProjectTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: taskKeys.tree(projectId ?? ''),
    queryFn: () => taskApi.listTree(projectId!),
    enabled: Boolean(projectId),
  });
}
