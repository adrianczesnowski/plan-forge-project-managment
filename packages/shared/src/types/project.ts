import type { ProjectRole, ProjectStatus, ProjectType } from './enums';
import type { UserSummary } from './user';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  type: ProjectType;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  spaceId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: ProjectRole;
  joinedAt: string;
  user: UserSummary;
}

/** Project as listed in the sidebar — with the caller's effective role. */
export interface ProjectWithRole extends Project {
  myRole: ProjectRole;
}
