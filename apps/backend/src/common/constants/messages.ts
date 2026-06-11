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
  },
  VALIDATION: {
    FAILED: 'Validation failed',
  },
  COMMON: {
    FORBIDDEN: 'You do not have permission to perform this action',
    INTERNAL_ERROR: 'Something went wrong, please try again later',
  },
} as const;
