import type {
  CreateProjectInput,
  Project,
  ProjectMember,
  ProjectWithRole,
  UpdateProjectInput,
} from '@planforge/shared';
import { apiClient, unwrap } from '@/shared/lib/api-client';

export const projectApi = {
  listBySpace: (spaceId: string) =>
    apiClient
      .get<never>(`/spaces/${spaceId}/projects`)
      .then((res) => unwrap<ProjectWithRole[]>(res)),

  getById: (id: string) =>
    apiClient.get<never>(`/projects/${id}`).then((res) => unwrap<ProjectWithRole>(res)),

  create: (input: CreateProjectInput) =>
    apiClient.post<never>('/projects', input).then((res) => unwrap<ProjectWithRole>(res)),

  update: (id: string, input: UpdateProjectInput) =>
    apiClient.patch<never>(`/projects/${id}`, input).then((res) => unwrap<Project>(res)),

  delete: (id: string) => apiClient.delete(`/projects/${id}`).then(() => undefined),

  listMembers: (id: string) =>
    apiClient.get<never>(`/projects/${id}/members`).then((res) => unwrap<ProjectMember[]>(res)),
};
