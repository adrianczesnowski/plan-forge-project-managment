import type { InvitationStatus, OrganizationRole } from './enums';
import type { UserSummary } from './user';

export interface Invitation {
  id: string;
  email: string;
  organizationId: string;
  invitedById: string;
  role: Exclude<OrganizationRole, 'OWNER'>;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
}

/** Invitation as listed for org admins (who invited whom). */
export interface InvitationWithInviter extends Invitation {
  invitedBy: UserSummary;
}

/** Pending invitation as seen by the invited user. */
export interface PendingInvitation extends Invitation {
  organization: { id: string; name: string; slug: string };
  invitedBy: UserSummary;
}
