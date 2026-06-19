import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AddFavoriteInput, FavoriteEntityType } from '@planforge/shared';
import { favoriteApi } from '../api/favorite.api';

export const favoriteKeys = {
  all: ['favorites'] as const,
};

export function useFavorites() {
  return useQuery({ queryKey: favoriteKeys.all, queryFn: favoriteApi.list });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: favoriteKeys.all });

  const add = useMutation({
    mutationFn: (input: AddFavoriteInput) => favoriteApi.add(input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: ({ entityType, entityId }: { entityType: FavoriteEntityType; entityId: string }) =>
      favoriteApi.remove(entityType, entityId),
    onSuccess: invalidate,
  });

  return { add, remove, isPending: add.isPending || remove.isPending };
}
