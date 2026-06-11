import type { SpaceRole } from './enums';
import type { UserSummary } from './user';

export interface Space {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  organizationId: string;
  createdById: string;
  order: number;
  createdAt: string;
}

export interface SpaceMember {
  id: string;
  userId: string;
  spaceId: string;
  role: SpaceRole;
  joinedAt: string;
  user: UserSummary;
}

/** Space as listed in the sidebar — with the caller's effective role. */
export interface SpaceWithRole extends Space {
  myRole: SpaceRole;
}
