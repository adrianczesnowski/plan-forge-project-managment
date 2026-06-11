import type { OrganizationRole } from './enums';
import type { UserSummary } from './user';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  joinedAt: string;
  user: UserSummary;
}

/** Organization of the current user together with their role in it. */
export interface MyOrganization extends Organization {
  myRole: OrganizationRole;
}
