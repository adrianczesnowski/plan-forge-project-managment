import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateCommentInput } from '@planforge/shared';
import { commentApi } from '../api/comment.api';

const commentKeys = {
  byTask: (taskId: string) => ['tasks', taskId, 'comments'] as const,
};

export function useTaskComments(taskId: string | undefined) {
  return useQuery({
    queryKey: commentKeys.byTask(taskId ?? ''),
    queryFn: () => commentApi.listByTask(taskId!),
    enabled: Boolean(taskId),
  });
}

export function useCreateComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCommentInput) => commentApi.create(taskId, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: commentKeys.byTask(taskId) }),
  });
}

export function useDeleteComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => commentApi.delete(commentId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: commentKeys.byTask(taskId) }),
  });
}
