import type { ActivityAction } from './enums';
import type { UserSummary } from './user';

export interface ActivityLog {
  id: string;
  userId: string | null;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  /** Changed field name (status, priority, assignee_id...) — null for CREATED/DELETED. */
  field: string | null;
  oldValue: unknown;
  newValue: unknown;
  projectId: string | null;
  createdAt: string;
  user: UserSummary | null;
}
