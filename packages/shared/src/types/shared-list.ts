import type { SharedListAccess, SharedListType } from './enums';
import type { UserSummary } from './user';

export interface SharedList {
  id: string;
  name: string;
  description: string | null;
  type: SharedListType;
  createdById: string;
  organizationId: string;
  projectId: string | null;
  createdAt: string;
}

export interface SharedListItem {
  id: string;
  listId: string;
  title: string;
  isCompleted: boolean;
  order: number;
  assigneeId: string | null;
  dueDate: string | null;
  createdAt: string;
  assignee: UserSummary | null;
}

export interface SharedListPermission {
  id: string;
  listId: string;
  userId: string;
  access: SharedListAccess;
  user: UserSummary;
}
