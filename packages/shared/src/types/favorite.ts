import type { FavoriteEntityType } from './enums';

export interface UserFavorite {
  id: string;
  userId: string;
  entityType: FavoriteEntityType;
  entityId: string;
  createdAt: string;
}
