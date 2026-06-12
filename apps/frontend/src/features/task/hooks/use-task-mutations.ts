import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateTaskInput, UpdateTaskInput } from '@planforge/shared';
import { taskApi } from '@/entities/task/api/task.api';
import { taskKeys } from '@/entities/task/hooks/use-tasks';

function useInvalidateTree(projectId: string) {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: taskKeys.tree(projectId) });
}

export function useCreateTask(projectId: string) {
  const invalidate = useInvalidateTree(projectId);
  return useMutation({
    mutationFn: (input: Omit<CreateTaskInput, 'projectId'>) =>
      taskApi.create({ ...input, projectId } as CreateTaskInput),
    onSuccess: invalidate,
  });
}

export function useUpdateTask(projectId: string) {
  const invalidate = useInvalidateTree(projectId);
  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      taskApi.update(taskId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteTask(projectId: string) {
  const invalidate = useInvalidateTree(projectId);
  return useMutation({
    mutationFn: (taskId: string) => taskApi.delete(taskId),
    onSuccess: invalidate,
  });
}
