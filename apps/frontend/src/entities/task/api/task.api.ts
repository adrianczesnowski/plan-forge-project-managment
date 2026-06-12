import type {
  BulkTaskActionInput,
  CreateTaskInput,
  MoveTaskInput,
  ReorderTasksInput,
  Task,
  TaskTreeNode,
  UpdateTaskInput,
} from '@planforge/shared';
import { apiClient, unwrap } from '@/shared/lib/api-client';

export const taskApi = {
  listTree: (projectId: string) =>
    apiClient.get<never>(`/projects/${projectId}/tasks`).then((res) => unwrap<TaskTreeNode[]>(res)),

  getById: (id: string) => apiClient.get<never>(`/tasks/${id}`).then((res) => unwrap<Task>(res)),

  create: (input: CreateTaskInput) =>
    apiClient.post<never>('/tasks', input).then((res) => unwrap<Task>(res)),

  update: (id: string, input: UpdateTaskInput) =>
    apiClient.patch<never>(`/tasks/${id}`, input).then((res) => unwrap<Task>(res)),

  delete: (id: string) => apiClient.delete(`/tasks/${id}`).then(() => undefined),

  move: (id: string, input: MoveTaskInput) =>
    apiClient.patch<never>(`/tasks/${id}/move`, input).then((res) => unwrap<TaskTreeNode[]>(res)),

  reorder: (input: ReorderTasksInput) =>
    apiClient.patch<never>('/tasks/reorder', input).then((res) => unwrap<TaskTreeNode[]>(res)),

  bulk: (input: BulkTaskActionInput) =>
    apiClient.post<never>('/tasks/bulk', input).then((res) => unwrap<{ affected: number }>(res)),
};
