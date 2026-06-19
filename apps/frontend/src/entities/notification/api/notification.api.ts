import type { Notification } from '@planforge/shared';
import { apiClient, unwrap } from '@/shared/lib/api-client';

export const notificationApi = {
  list: () => apiClient.get<never>('/notifications').then((res) => unwrap<Notification[]>(res)),

  unreadCount: () =>
    apiClient.get<never>('/notifications/unread-count').then((res) => unwrap<{ count: number }>(res)),

  markRead: (id: string) =>
    apiClient.patch<never>(`/notifications/${id}/read`).then(() => undefined),

  markAllRead: () => apiClient.patch<never>('/notifications/read-all').then(() => undefined),
};
