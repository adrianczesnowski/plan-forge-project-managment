import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '@/entities/project/api/project.api';
import { projectKeys } from '@/entities/project/hooks/use-projects';

export function useCreateProject() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: projectApi.create,
    onSuccess: (project) => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.bySpace(project.spaceId) });
      navigate(`/projects/${project.id}`);
    },
  });
}
