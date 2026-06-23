import type { FavoriteEntityType } from './enums';

/** A space or project the user has hidden from their workspace views (per-user). */
export interface HiddenItem {
  id: string;
  entityType: FavoriteEntityType;
  entityId: string;
  name: string;
  /** Space colour (SPACE) — null for projects. */
  color: string | null;
  createdAt: string;
}
