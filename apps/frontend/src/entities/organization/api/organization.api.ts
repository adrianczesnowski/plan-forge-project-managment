import type {
  CreateOrganizationInput,
  MyOrganization,
  OrganizationMember,
  UpdateOrganizationMemberInput,
} from '@planforge/shared';
import { apiClient, unwrap } from '@/shared/lib/api-client';

export const organizationApi = {
  getCurrent: () =>
    apiClient.get<never>('/organizations/current').then((res) => unwrap<MyOrganization | null>(res)),

  create: (input: CreateOrganizationInput) =>
    apiClient.post<never>('/organizations', input).then((res) => unwrap<MyOrganization>(res)),

  listMembers: (id: string) =>
    apiClient
      .get<never>(`/organizations/${id}/members`)
      .then((res) => unwrap<OrganizationMember[]>(res)),

  updateMemberRole: (id: string, userId: string, input: UpdateOrganizationMemberInput) =>
    apiClient
      .patch<never>(`/organizations/${id}/members/${userId}`, input)
      .then((res) => unwrap<OrganizationMember>(res)),

  removeMember: (id: string, userId: string) =>
    apiClient.delete(`/organizations/${id}/members/${userId}`).then(() => undefined),
};
