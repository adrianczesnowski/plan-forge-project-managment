import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AddHiddenInput, FavoriteEntityType } from '@planforge/shared';
import { hiddenApi } from '../api/hidden.api';

/** Hide / un-hide a space or project for the current user (per-user view preference). */
export function useToggleHidden() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    // The per-user `hidden` flag lives on spaces and projects, so refresh both trees.
    void queryClient.invalidateQueries({ queryKey: ['spaces'] });
    void queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  const hide = useMutation({
    mutationFn: (input: AddHiddenInput) => hiddenApi.add(input),
    onSuccess: invalidate,
  });
  const unhide = useMutation({
    mutationFn: ({ entityType, entityId }: { entityType: FavoriteEntityType; entityId: string }) =>
      hiddenApi.remove(entityType, entityId),
    onSuccess: invalidate,
  });

  return { hide, unhide, isPending: hide.isPending || unhide.isPending };
}
