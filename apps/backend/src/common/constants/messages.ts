/**
 * Central registry of every user-facing backend message.
 * English only — translation happens on the frontend (errors.json namespace).
 */
export const MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_TAKEN: 'An account with this email already exists',
    UNAUTHORIZED: 'Authentication required',
    REFRESH_TOKEN_INVALID: 'Refresh token is invalid or expired',
  },
  USER: {
    NOT_FOUND: 'User not found',
    INVALID_CURRENT_PASSWORD: 'Current password is incorrect',
  },
  ORGANIZATION: {
    NOT_FOUND: 'Organization not found',
    ALREADY_MEMBER: 'User is already a member of an organization',
    NOT_A_MEMBER: 'User is not a member of this organization',
    MUST_TRANSFER_OWNERSHIP: 'Owner must transfer ownership before leaving',
    CANNOT_REMOVE_OWNER: 'Organization owner cannot be removed',
    CANNOT_CHANGE_OWNER_ROLE: 'Use ownership transfer to change the owner',
    SLUG_TAKEN: 'This slug is already in use',
    FORBIDDEN: 'You do not have permission to manage this organization',
  },
  INVITATION: {
    NOT_FOUND: 'Invitation not found',
    ALREADY_SENT: 'Invitation already sent to this email',
    EXPIRED: 'Invitation has expired',
    NOT_PENDING: 'Invitation is no longer pending',
    NOT_FOR_YOU: 'This invitation was sent to a different email address',
    USER_IN_ORGANIZATION: 'Leave your current organization before accepting an invitation',
    CANNOT_INVITE_SELF: 'You cannot invite yourself',
  },
  SPACE: {
    NOT_FOUND: 'Space not found',
    FORBIDDEN: 'You do not have permission to manage this space',
    ALREADY_MEMBER: 'User is already a member of this space',
    MEMBER_NOT_FOUND: 'User is not a member of this space',
    NOT_IN_ORGANIZATION: 'User must belong to the organization first',
    CANNOT_GRANT_HIGHER_ROLE: 'You cannot grant a role higher than your own',
    CANNOT_REMOVE_OWNER: 'Space owner cannot be removed by an admin',
    IMPLICIT_ACCESS: 'Organization owners and admins have implicit access and cannot be managed here',
  },
  PROJECT: {
    NOT_FOUND: 'Project not found',
    FORBIDDEN: 'You do not have permission to manage this project',
    ALREADY_MEMBER: 'User is already a member of this project',
    MEMBER_NOT_FOUND: 'User is not a member of this project',
    NOT_IN_SPACE: 'User must belong to the space first',
    CANNOT_GRANT_HIGHER_ROLE: 'You cannot grant a role higher than your own',
    CANNOT_REMOVE_OWNER: 'Project owner cannot be removed by an admin',
    IMPLICIT_ACCESS: 'This user has implicit access and cannot be managed here',
  },
  TASK: {
    NOT_FOUND: 'Task not found',
    PARENT_NOT_FOUND: 'Parent task not found',
    PARENT_DIFFERENT_PROJECT: 'Parent task must belong to the same project',
    CYCLIC_HIERARCHY: 'Cannot move a task under its own subtask',
    ASSIGNEE_NO_ACCESS: 'Assignee must have access to the project',
    NOT_IN_PROJECT: 'All tasks must belong to the same project',
  },
  DEPENDENCY: {
    NOT_FOUND: 'Dependency not found',
    DIFFERENT_PROJECT: 'Both tasks must belong to the same project',
    ALREADY_EXISTS: 'These tasks are already linked',
    CYCLE: 'This dependency would create a cycle',
    SELF: 'Task cannot depend on itself',
  },
  COMMENT: {
    NOT_FOUND: 'Comment not found',
    NOT_AUTHOR: 'Only the author can modify this comment',
  },
  VALIDATION: {
    FAILED: 'Validation failed',
  },
  COMMON: {
    FORBIDDEN: 'You do not have permission to perform this action',
    INTERNAL_ERROR: 'Something went wrong, please try again later',
  },
} as const;
