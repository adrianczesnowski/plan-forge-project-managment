import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { spaceApi } from '../api/space.api';

export const SPACES_KEY = ['spaces'] as const;

export function useSpaces() {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: SPACES_KEY,
    queryFn: spaceApi.list,
    enabled: status === 'authenticated',
  });
}

export function useSpace(spaceId: string | undefined) {
  return useQuery({
    queryKey: [...SPACES_KEY, spaceId],
    queryFn: () => spaceApi.getById(spaceId!),
    enabled: Boolean(spaceId),
  });
}
