import type { TaskPriority, TaskStatus } from './enums';
import type { UserSummary } from './user';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string | null;
  endDate: string | null;
  estimatedHours: number | null;
  progress: number;
  projectId: string;
  parentId: string | null;
  assigneeId: string | null;
  createdById: string;
  wbsNumber: string;
  order: number;
  isMilestone: boolean;
  createdAt: string;
  updatedAt: string;
  assignee: UserSummary | null;
}

/** Node of the WBS tree returned by GET /projects/:id/tasks. */
export interface TaskTreeNode extends Task {
  children: TaskTreeNode[];
}
