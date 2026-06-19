import type { ActivityLog } from '@planforge/shared';
import { apiClient, unwrap } from '@/shared/lib/api-client';

export const activityApi = {
  listByTask: (taskId: string) =>
    apiClient.get<never>(`/tasks/${taskId}/activity`).then((res) => unwrap<ActivityLog[]>(res)),
};
