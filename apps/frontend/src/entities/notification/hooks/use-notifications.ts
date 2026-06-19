import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/shared/lib/socket';
import { notificationApi } from '../api/notification.api';

export const notificationKeys = {
  list: ['notifications'] as const,
  unread: ['notifications', 'unread'] as const,
};

export function useNotifications() {
  return useQuery({ queryKey: notificationKeys.list, queryFn: notificationApi.list });
}

export function useUnreadCount() {
  return useQuery({ queryKey: notificationKeys.unread, queryFn: notificationApi.unreadCount });
}

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: notificationKeys.list });
    void queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
  };
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({ mutationFn: (id: string) => notificationApi.markRead(id), onSuccess: invalidate });
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({ mutationFn: () => notificationApi.markAllRead(), onSuccess: invalidate });
}

/** Refreshes notifications when the server pushes a new one (user room). */
export function useNotificationRealtime() {
  const invalidate = useInvalidateNotifications();
  useEffect(() => {
    const socket = getSocket();
    const onNew = () => invalidate();
    socket.on('notification:new', onNew);
    return () => void socket.off('notification:new', onNew);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
