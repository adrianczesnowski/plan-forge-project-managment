import type { CreateSpaceInput, SpaceWithRole, UpdateSpaceInput, Space } from '@planforge/shared';
import { apiClient, unwrap } from '@/shared/lib/api-client';

export const spaceApi = {
  list: () => apiClient.get<never>('/spaces').then((res) => unwrap<SpaceWithRole[]>(res)),

  getById: (id: string) =>
    apiClient.get<never>(`/spaces/${id}`).then((res) => unwrap<SpaceWithRole>(res)),

  create: (input: CreateSpaceInput) =>
    apiClient.post<never>('/spaces', input).then((res) => unwrap<SpaceWithRole>(res)),

  update: (id: string, input: UpdateSpaceInput) =>
    apiClient.patch<never>(`/spaces/${id}`, input).then((res) => unwrap<Space>(res)),

  delete: (id: string) => apiClient.delete(`/spaces/${id}`).then(() => undefined),

  reorder: (spaceIds: string[]) =>
    apiClient.patch('/spaces/reorder', { spaceIds }).then(() => undefined),
};
