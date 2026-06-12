import type { Comment, CreateCommentInput } from '@planforge/shared';
import { apiClient, unwrap } from '@/shared/lib/api-client';

export const commentApi = {
  listByTask: (taskId: string) =>
    apiClient.get<never>(`/tasks/${taskId}/comments`).then((res) => unwrap<Comment[]>(res)),

  create: (taskId: string, input: CreateCommentInput) =>
    apiClient.post<never>(`/tasks/${taskId}/comments`, input).then((res) => unwrap<Comment>(res)),

  delete: (commentId: string) => apiClient.delete(`/comments/${commentId}`).then(() => undefined),
};
