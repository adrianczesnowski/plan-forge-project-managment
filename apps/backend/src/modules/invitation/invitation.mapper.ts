import type {
  Invitation as PrismaInvitation,
  Organization as PrismaOrganization,
  User as PrismaUser,
} from '@prisma/client';
import type { Invitation, InvitationWithInviter, PendingInvitation } from '@planforge/shared';
import { toUserSummary } from '../user/user.mapper';

function baseInvitation(invitation: PrismaInvitation): Invitation {
  return {
    id: invitation.id,
    email: invitation.email,
    organizationId: invitation.organizationId,
    invitedById: invitation.invitedById,
    role: invitation.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
    status: invitation.status,
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
  };
}

export function toInvitationWithInviter(
  invitation: PrismaInvitation & { invitedBy: PrismaUser },
): InvitationWithInviter {
  return { ...baseInvitation(invitation), invitedBy: toUserSummary(invitation.invitedBy) };
}

export function toPendingInvitation(
  invitation: PrismaInvitation & { invitedBy: PrismaUser; organization: PrismaOrganization },
): PendingInvitation {
  return {
    ...baseInvitation(invitation),
    invitedBy: toUserSummary(invitation.invitedBy),
    organization: {
      id: invitation.organization.id,
      name: invitation.organization.name,
      slug: invitation.organization.slug,
    },
  };
}
