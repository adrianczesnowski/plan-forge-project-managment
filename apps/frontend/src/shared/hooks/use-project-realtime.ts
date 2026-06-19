import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/shared/lib/socket';

interface RealtimePayload {
  projectId: string;
  taskId?: string;
}

/**
 * Subscribes to a project's realtime room and invalidates the affected
 * react-query caches when other users change tasks, comments or activity.
 */
export function useProjectRealtime(projectId: string | undefined): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return;
    const socket = getSocket();

    const subscribe = () => socket.emit('subscribe:project', projectId);
    if (socket.connected) subscribe();
    socket.on('connect', subscribe);

    const onTask = (p: RealtimePayload) => {
      if (p.projectId !== projectId) return;
      // Covers tasks, dependencies and the dashboard (all keyed under the project).
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    };
    const onComment = (p: RealtimePayload) => {
      if (p.projectId === projectId && p.taskId) {
        void queryClient.invalidateQueries({ queryKey: ['tasks', p.taskId, 'comments'] });
      }
    };
    const onActivity = (p: RealtimePayload) => {
      if (p.projectId === projectId && p.taskId) {
        void queryClient.invalidateQueries({ queryKey: ['tasks', p.taskId, 'activity'] });
      }
    };

    socket.on('task:changed', onTask);
    socket.on('comment:changed', onComment);
    socket.on('activity:changed', onActivity);

    return () => {
      socket.emit('unsubscribe:project', projectId);
      socket.off('connect', subscribe);
      socket.off('task:changed', onTask);
      socket.off('comment:changed', onComment);
      socket.off('activity:changed', onActivity);
    };
  }, [projectId, queryClient]);
}
