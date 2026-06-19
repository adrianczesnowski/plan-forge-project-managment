import type { ProjectDashboard } from '@planforge/shared';
import { apiClient, unwrap } from '@/shared/lib/api-client';

export const dashboardApi = {
  getProject: (projectId: string) =>
    apiClient
      .get<never>(`/projects/${projectId}/dashboard`)
      .then((res) => unwrap<ProjectDashboard>(res)),
};
