import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';

export const dashboardKeys = {
  project: (projectId: string) => ['projects', projectId, 'dashboard'] as const,
};

export function useProjectDashboard(projectId: string | undefined) {
  return useQuery({
    queryKey: dashboardKeys.project(projectId ?? ''),
    queryFn: () => dashboardApi.getProject(projectId!),
    enabled: Boolean(projectId),
  });
}
