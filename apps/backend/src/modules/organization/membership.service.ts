import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  OrganizationRole,
  type Organization,
  type OrganizationMember,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MESSAGES } from '../../common/constants/messages';

export type MembershipWithOrganization = OrganizationMember & { organization: Organization };

/** Resolves and enforces a user's membership/role within an organization. */
@Injectable()
export class MembershipService {
  constructor(private readonly prisma: PrismaService) {}

  /** The single organization the user currently belongs to (business rule: at most one). */
  findCurrent(userId: string): Promise<MembershipWithOrganization | null> {
    return this.prisma.organizationMember.findFirst({
      where: { userId },
      include: { organization: true },
    });
  }

  find(userId: string, organizationId: string): Promise<OrganizationMember | null> {
    return this.prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });
  }

  /** Throws 404 if the user is not a member, 403 if the role is insufficient. */
  async requireRole(
    userId: string,
    organizationId: string,
    allowedRoles: OrganizationRole[],
  ): Promise<OrganizationMember> {
    const membership = await this.find(userId, organizationId);
    if (!membership) {
      throw new NotFoundException(MESSAGES.ORGANIZATION.NOT_FOUND);
    }
    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(MESSAGES.ORGANIZATION.FORBIDDEN);
    }
    return membership;
  }

  requireMember(userId: string, organizationId: string): Promise<OrganizationMember> {
    return this.requireRole(userId, organizationId, [
      OrganizationRole.OWNER,
      OrganizationRole.ADMIN,
      OrganizationRole.MEMBER,
    ]);
  }

  requireAdmin(userId: string, organizationId: string): Promise<OrganizationMember> {
    return this.requireRole(userId, organizationId, [
      OrganizationRole.OWNER,
      OrganizationRole.ADMIN,
    ]);
  }
}
