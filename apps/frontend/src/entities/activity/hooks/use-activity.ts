import { useQuery } from '@tanstack/react-query';
import { activityApi } from '../api/activity.api';

export const activityKeys = {
  byTask: (taskId: string) => ['tasks', taskId, 'activity'] as const,
};

export function useTaskActivity(taskId: string | undefined) {
  return useQuery({
    queryKey: activityKeys.byTask(taskId ?? ''),
    queryFn: () => activityApi.listByTask(taskId!),
    enabled: Boolean(taskId),
  });
}
