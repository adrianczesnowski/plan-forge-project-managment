import type {
  AddSpaceMemberInput,
  CreateSpaceInput,
  Space,
  SpaceMember,
  SpaceWithRole,
  UpdateSpaceInput,
  UpdateSpaceMemberInput,
} from '@planforge/shared';
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

  listMembers: (id: string) =>
    apiClient.get<never>(`/spaces/${id}/members`).then((res) => unwrap<SpaceMember[]>(res)),

  addMember: (id: string, input: AddSpaceMemberInput) =>
    apiClient.post<never>(`/spaces/${id}/members`, input).then((res) => unwrap<SpaceMember>(res)),

  updateMemberRole: (id: string, userId: string, input: UpdateSpaceMemberInput) =>
    apiClient
      .patch<never>(`/spaces/${id}/members/${userId}`, input)
      .then((res) => unwrap<SpaceMember>(res)),

  removeMember: (id: string, userId: string) =>
    apiClient.delete(`/spaces/${id}/members/${userId}`).then(() => undefined),
};
