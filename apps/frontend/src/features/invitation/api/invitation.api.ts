import type {
  CreateInvitationInput,
  InvitationWithInviter,
  MyOrganization,
  PendingInvitation,
} from '@planforge/shared';
import { apiClient, unwrap } from '@/shared/lib/api-client';

export const invitationApi = {
  create: (input: CreateInvitationInput) =>
    apiClient.post<never>('/invitations', input).then((res) => unwrap<InvitationWithInviter>(res)),

  listPending: () =>
    apiClient.get<never>('/invitations/pending').then((res) => unwrap<PendingInvitation[]>(res)),

  accept: (id: string) =>
    apiClient.post<never>(`/invitations/${id}/accept`).then((res) => unwrap<MyOrganization>(res)),

  reject: (id: string) => apiClient.post(`/invitations/${id}/reject`).then(() => undefined),
};
