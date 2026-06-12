import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { SPACES_KEY } from '@/entities/space/hooks/use-spaces';
import { spaceApi } from '@/entities/space/api/space.api';

export function useCreateSpace() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: spaceApi.create,
    onSuccess: (space) => {
      void queryClient.invalidateQueries({ queryKey: SPACES_KEY });
      navigate(`/spaces/${space.id}`);
    },
  });
}
