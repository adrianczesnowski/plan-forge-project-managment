import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MoveTaskInput } from '@planforge/shared';
import { taskApi } from '@/entities/task/api/task.api';
import { taskKeys } from '@/entities/task/hooks/use-tasks';

/** Moves a task in the hierarchy; the endpoint returns the fresh tree. */
export function useMoveTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: MoveTaskInput }) =>
      taskApi.move(taskId, input),
    onSuccess: (tree) => {
      queryClient.setQueryData(taskKeys.tree(projectId), tree);
    },
  });
}
