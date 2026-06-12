import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationRole, SpaceRole, type Space } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MESSAGES } from '../../common/constants/messages';
import { MembershipService } from '../organization/membership.service';

export interface SpaceAccess {
  space: Space;
  /** Effective role, after org-level inheritance (org OWNER/ADMIN → space OWNER). */
  role: SpaceRole;
  /** True when the role comes from the org level (no space_members row). */
  inherited: boolean;
}

const ROLE_WEIGHT: Record<SpaceRole, number> = { OWNER: 3, ADMIN: 2, MEMBER: 1 };

/** Resolves effective space roles, applying inheritance from the organization. */
@Injectable()
export class SpaceAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  async resolve(userId: string, spaceId: string): Promise<SpaceAccess | null> {
    const space = await this.prisma.space.findUnique({ where: { id: spaceId } });
    if (!space) return null;

    const orgMembership = await this.membership.find(userId, space.organizationId);
    if (!orgMembership) return null;

    if (orgMembership.role !== OrganizationRole.MEMBER) {
      return { space, role: SpaceRole.OWNER, inherited: true };
    }

    const spaceMember = await this.prisma.spaceMember.findUnique({
      where: { userId_spaceId: { userId, spaceId } },
    });
    return spaceMember ? { space, role: spaceMember.role, inherited: false } : null;
  }

  /** 404 when the space is invisible to the user, 403 when the role is too low. */
  async require(userId: string, spaceId: string, minimumRole: SpaceRole): Promise<SpaceAccess> {
    const access = await this.resolve(userId, spaceId);
    if (!access) {
      throw new NotFoundException(MESSAGES.SPACE.NOT_FOUND);
    }
    if (ROLE_WEIGHT[access.role] < ROLE_WEIGHT[minimumRole]) {
      throw new ForbiddenException(MESSAGES.SPACE.FORBIDDEN);
    }
    return access;
  }
}
