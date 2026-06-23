import type { AddHiddenInput, HiddenItem } from '@planforge/shared';
import { apiClient, unwrap } from '@/shared/lib/api-client';

export const hiddenApi = {
  list: () => apiClient.get<never>('/hidden').then((res) => unwrap<HiddenItem[]>(res)),

  add: (input: AddHiddenInput) => apiClient.post<never>('/hidden', input).then(() => undefined),

  remove: (entityType: string, entityId: string) =>
    apiClient.delete(`/hidden/${entityType}/${entityId}`).then(() => undefined),
};
