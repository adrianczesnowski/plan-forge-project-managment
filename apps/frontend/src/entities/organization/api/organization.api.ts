import type { CreateOrganizationInput, MyOrganization } from '@planforge/shared';
import { apiClient, unwrap } from '@/shared/lib/api-client';

export const organizationApi = {
  getCurrent: () =>
    apiClient.get<never>('/organizations/current').then((res) => unwrap<MyOrganization | null>(res)),

  create: (input: CreateOrganizationInput) =>
    apiClient.post<never>('/organizations', input).then((res) => unwrap<MyOrganization>(res)),
};
