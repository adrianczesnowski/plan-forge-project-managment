import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationRole, SpaceRole } from '@prisma/client';
import type {
  CreateSpaceInput,
  ReorderSpacesInput,
  Space,
  SpaceMember,
  SpaceWithRole,
  UpdateSpaceInput,
} from '@planforge/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { MESSAGES } from '../../common/constants/messages';
import { MembershipService } from '../organization/membership.service';
import { SpaceAccessService } from './space-access.service';
import { toSpaceDto, toSpaceMemberDto, toSpaceWithRole } from './space.mapper';

@Injectable()
export class SpaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
    private readonly access: SpaceAccessService,
  ) {}

  /** Org OWNER/ADMIN only — plain members cannot create spaces. */
  async create(userId: string, dto: CreateSpaceInput): Promise<SpaceWithRole> {
    const orgMembership = await this.requireCurrentMembership(userId);
    if (orgMembership.role === OrganizationRole.MEMBER) {
      throw new ForbiddenException(MESSAGES.SPACE.FORBIDDEN);
    }

    const lastSpace = await this.prisma.space.findFirst({
      where: { organizationId: orgMembership.organizationId },
      orderBy: { order: 'desc' },
    });

    const space = await this.prisma.space.create({
      data: {
        ...dto,
        organizationId: orgMembership.organizationId,
        createdById: userId,
        order: (lastSpace?.order ?? -1) + 1,
      },
    });
    return toSpaceWithRole(space, SpaceRole.OWNER);
  }

  /** Spaces visible to the user: all for org OWNER/ADMIN, assigned ones for MEMBER. */
  async list(userId: string): Promise<SpaceWithRole[]> {
    const orgMembership = await this.requireCurrentMembership(userId);

    if (orgMembership.role !== OrganizationRole.MEMBER) {
      const spaces = await this.prisma.space.findMany({
        where: { organizationId: orgMembership.organizationId },
        orderBy: { order: 'asc' },
      });
      return spaces.map((space) => toSpaceWithRole(space, SpaceRole.OWNER));
    }

    const memberships = await this.prisma.spaceMember.findMany({
      where: { userId, space: { organizationId: orgMembership.organizationId } },
      include: { space: true },
      orderBy: { space: { order: 'asc' } },
    });
    return memberships.map((m) => toSpaceWithRole(m.space, m.role));
  }

  async getById(userId: string, spaceId: string): Promise<SpaceWithRole> {
    const access = await this.access.require(userId, spaceId, SpaceRole.MEMBER);
    return toSpaceWithRole(access.space, access.role);
  }

  async update(userId: string, spaceId: string, dto: UpdateSpaceInput): Promise<Space> {
    await this.access.require(userId, spaceId, SpaceRole.ADMIN);
    const space = await this.prisma.space.update({ where: { id: spaceId }, data: dto });
    return toSpaceDto(space);
  }

  async delete(userId: string, spaceId: string): Promise<void> {
    await this.access.require(userId, spaceId, SpaceRole.OWNER);
    await this.prisma.space.delete({ where: { id: spaceId } });
  }

  /** Persists sidebar drag & drop order (org OWNER/ADMIN). */
  async reorder(userId: string, dto: ReorderSpacesInput): Promise<void> {
    const orgMembership = await this.requireCurrentMembership(userId);
    if (orgMembership.role === OrganizationRole.MEMBER) {
      throw new ForbiddenException(MESSAGES.SPACE.FORBIDDEN);
    }

    const spaces = await this.prisma.space.findMany({
      where: { id: { in: dto.spaceIds }, organizationId: orgMembership.organizationId },
    });
    if (spaces.length !== dto.spaceIds.length) {
      throw new BadRequestException(MESSAGES.SPACE.NOT_FOUND);
    }

    await this.prisma.$transaction(
      dto.spaceIds.map((id, index) =>
        this.prisma.space.update({ where: { id }, data: { order: index } }),
      ),
    );
  }

  async listMembers(userId: string, spaceId: string): Promise<SpaceMember[]> {
    await this.access.require(userId, spaceId, SpaceRole.MEMBER);
    const members = await this.prisma.spaceMember.findMany({
      where: { spaceId },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    });
    return members.map(toSpaceMemberDto);
  }

  async addMember(
    actorId: string,
    spaceId: string,
    dto: { userId: string; role: SpaceRole },
  ): Promise<SpaceMember> {
    const access = await this.access.require(actorId, spaceId, SpaceRole.ADMIN);
    if (dto.role === SpaceRole.OWNER && access.role !== SpaceRole.OWNER) {
      throw new ForbiddenException(MESSAGES.SPACE.CANNOT_GRANT_HIGHER_ROLE);
    }

    const targetOrgMembership = await this.membership.find(
      dto.userId,
      access.space.organizationId,
    );
    if (!targetOrgMembership) {
      throw new BadRequestException(MESSAGES.SPACE.NOT_IN_ORGANIZATION);
    }
    // Org OWNER/ADMIN already have implicit OWNER access — a row would only confuse the role logic.
    if (targetOrgMembership.role !== OrganizationRole.MEMBER) {
      throw new BadRequestException(MESSAGES.SPACE.IMPLICIT_ACCESS);
    }

    const existing = await this.prisma.spaceMember.findUnique({
      where: { userId_spaceId: { userId: dto.userId, spaceId } },
    });
    if (existing) {
      throw new ConflictException(MESSAGES.SPACE.ALREADY_MEMBER);
    }

    const member = await this.prisma.spaceMember.create({
      data: { userId: dto.userId, spaceId, role: dto.role },
      include: { user: true },
    });
    return toSpaceMemberDto(member);
  }

  async updateMemberRole(
    actorId: string,
    spaceId: string,
    targetUserId: string,
    role: SpaceRole,
  ): Promise<SpaceMember> {
    await this.access.require(actorId, spaceId, SpaceRole.OWNER);
    const target = await this.requireSpaceMember(spaceId, targetUserId);

    const updated = await this.prisma.spaceMember.update({
      where: { id: target.id },
      data: { role },
      include: { user: true },
    });
    return toSpaceMemberDto(updated);
  }

  async removeMember(actorId: string, spaceId: string, targetUserId: string): Promise<void> {
    const access = await this.access.require(actorId, spaceId, SpaceRole.ADMIN);
    const target = await this.requireSpaceMember(spaceId, targetUserId);

    if (target.role === SpaceRole.OWNER && access.role !== SpaceRole.OWNER) {
      throw new ForbiddenException(MESSAGES.SPACE.CANNOT_REMOVE_OWNER);
    }
    await this.prisma.spaceMember.delete({ where: { id: target.id } });
  }

  private async requireCurrentMembership(userId: string) {
    const membership = await this.membership.findCurrent(userId);
    if (!membership) {
      throw new NotFoundException(MESSAGES.ORGANIZATION.NOT_FOUND);
    }
    return membership;
  }

  private async requireSpaceMember(spaceId: string, userId: string) {
    const member = await this.prisma.spaceMember.findUnique({
      where: { userId_spaceId: { userId, spaceId } },
    });
    if (!member) {
      throw new NotFoundException(MESSAGES.SPACE.MEMBER_NOT_FOUND);
    }
    return member;
  }
}
