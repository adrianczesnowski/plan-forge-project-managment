import type { AddFavoriteInput, FavoriteItem } from '@planforge/shared';
import { apiClient, unwrap } from '@/shared/lib/api-client';

export const favoriteApi = {
  list: () => apiClient.get<never>('/favorites').then((res) => unwrap<FavoriteItem[]>(res)),

  add: (input: AddFavoriteInput) => apiClient.post<never>('/favorites', input).then(() => undefined),

  remove: (entityType: string, entityId: string) =>
    apiClient.delete(`/favorites/${entityType}/${entityId}`).then(() => undefined),
};
