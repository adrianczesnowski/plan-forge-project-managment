import type { FavoriteEntityType } from './enums';

export interface UserFavorite {
  id: string;
  userId: string;
  entityType: FavoriteEntityType;
  entityId: string;
  createdAt: string;
}

/** Favorite enriched with the target entity's display data (for the sidebar). */
export interface FavoriteItem {
  id: string;
  entityType: FavoriteEntityType;
  entityId: string;
  name: string;
  /** Space colour (SPACE) — null for projects. */
  color: string | null;
  createdAt: string;
}
