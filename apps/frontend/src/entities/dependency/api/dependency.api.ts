import type { CreateDependencyInput, Dependency } from '@planforge/shared';
import { apiClient, unwrap } from '@/shared/lib/api-client';

export const dependencyApi = {
  listByProject: (projectId: string) =>
    apiClient
      .get<never>(`/projects/${projectId}/dependencies`)
      .then((res) => unwrap<Dependency[]>(res)),

  listByTask: (taskId: string) =>
    apiClient.get<never>(`/tasks/${taskId}/dependencies`).then((res) => unwrap<Dependency[]>(res)),

  create: (input: CreateDependencyInput) =>
    apiClient.post<never>('/dependencies', input).then((res) => unwrap<Dependency>(res)),

  delete: (id: string) => apiClient.delete(`/dependencies/${id}`).then(() => undefined),
};
