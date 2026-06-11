export const OrganizationRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;
export type OrganizationRole = (typeof OrganizationRole)[keyof typeof OrganizationRole];

export const SpaceRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;
export type SpaceRole = (typeof SpaceRole)[keyof typeof SpaceRole];

export const ProjectRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER',
} as const;
export type ProjectRole = (typeof ProjectRole)[keyof typeof ProjectRole];

export const InvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;
export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus];

export const ProjectType = {
  WATERFALL: 'WATERFALL',
} as const;
export type ProjectType = (typeof ProjectType)[keyof typeof ProjectType];

export const ProjectStatus = {
  PLANNING: 'PLANNING',
  ACTIVE: 'ACTIVE',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  IN_REVIEW: 'IN_REVIEW',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  NONE: 'NONE',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const DependencyType = {
  FS: 'FS',
  SS: 'SS',
  FF: 'FF',
  SF: 'SF',
} as const;
export type DependencyType = (typeof DependencyType)[keyof typeof DependencyType];

export const SharedListType = {
  PERSONAL: 'PERSONAL',
  SHARED: 'SHARED',
} as const;
export type SharedListType = (typeof SharedListType)[keyof typeof SharedListType];

export const SharedListAccess = {
  CAN_VIEW: 'CAN_VIEW',
  CAN_EDIT: 'CAN_EDIT',
} as const;
export type SharedListAccess = (typeof SharedListAccess)[keyof typeof SharedListAccess];

export const FavoriteEntityType = {
  PROJECT: 'PROJECT',
  SPACE: 'SPACE',
} as const;
export type FavoriteEntityType = (typeof FavoriteEntityType)[keyof typeof FavoriteEntityType];

export const ActivityAction = {
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  DELETED: 'DELETED',
  COMMENTED: 'COMMENTED',
} as const;
export type ActivityAction = (typeof ActivityAction)[keyof typeof ActivityAction];

export const NotificationType = {
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  COMMENT_MENTION: 'COMMENT_MENTION',
  TASK_STATUS_CHANGED: 'TASK_STATUS_CHANGED',
  DEADLINE_APPROACHING: 'DEADLINE_APPROACHING',
  ORGANIZATION_INVITATION: 'ORGANIZATION_INVITATION',
  ROLE_CHANGED: 'ROLE_CHANGED',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
