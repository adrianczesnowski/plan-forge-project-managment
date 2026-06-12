import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationRole } from '@prisma/client';
import type {
  CreateOrganizationInput,
  MyOrganization,
  Organization,
  OrganizationMember,
  TransferOwnershipInput,
  UpdateOrganizationInput,
  UpdateOrganizationMemberInput,
} from '@planforge/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { MESSAGES } from '../../common/constants/messages';
import { randomSlugSuffix, slugify } from '../../common/utils/slug';
import { MembershipService } from './membership.service';
import {
  toMyOrganizationDto,
  toOrganizationDto,
  toOrganizationMemberDto,
} from './organization.mapper';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  async create(userId: string, dto: CreateOrganizationInput): Promise<MyOrganization> {
    const existing = await this.membership.findCurrent(userId);
    if (existing) {
      throw new ConflictException(MESSAGES.ORGANIZATION.ALREADY_MEMBER);
    }

    const organization = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug: await this.uniqueSlug(dto.name),
        ownerId: userId,
        members: { create: { userId, role: OrganizationRole.OWNER } },
      },
      include: { members: true },
    });

    const member = organization.members[0];
    if (!member) {
      throw new Error('Organization created without owner membership');
    }
    return toMyOrganizationDto(organization, member);
  }

  /** Organization of the logged-in user (or null — drives the onboarding redirect). */
  async getCurrent(userId: string): Promise<MyOrganization | null> {
    const membership = await this.membership.findCurrent(userId);
    return membership ? toMyOrganizationDto(membership.organization, membership) : null;
  }

  async getById(userId: string, organizationId: string): Promise<MyOrganization> {
    const membership = await this.membership.requireMember(userId, organizationId);
    const organization = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });
    return toMyOrganizationDto(organization, membership);
  }

  async update(
    userId: string,
    organizationId: string,
    dto: UpdateOrganizationInput,
  ): Promise<Organization> {
    await this.membership.requireAdmin(userId, organizationId);

    if (dto.slug) {
      const taken = await this.prisma.organization.findFirst({
        where: { slug: dto.slug, id: { not: organizationId } },
      });
      if (taken) {
        throw new ConflictException(MESSAGES.ORGANIZATION.SLUG_TAKEN);
      }
    }

    const organization = await this.prisma.organization.update({
      where: { id: organizationId },
      data: dto,
    });
    return toOrganizationDto(organization);
  }

  async delete(userId: string, organizationId: string): Promise<void> {
    await this.membership.requireRole(userId, organizationId, [OrganizationRole.OWNER]);
    await this.prisma.organization.delete({ where: { id: organizationId } });
  }

  async listMembers(userId: string, organizationId: string): Promise<OrganizationMember[]> {
    await this.membership.requireMember(userId, organizationId);
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    });
    return members.map(toOrganizationMemberDto);
  }

  async updateMemberRole(
    actorId: string,
    organizationId: string,
    targetUserId: string,
    dto: UpdateOrganizationMemberInput,
  ): Promise<OrganizationMember> {
    await this.membership.requireAdmin(actorId, organizationId);
    const target = await this.requireTargetMember(organizationId, targetUserId);

    if (target.role === OrganizationRole.OWNER) {
      throw new ForbiddenException(MESSAGES.ORGANIZATION.CANNOT_CHANGE_OWNER_ROLE);
    }

    const updated = await this.prisma.organizationMember.update({
      where: { id: target.id },
      data: { role: dto.role },
      include: { user: true },
    });
    return toOrganizationMemberDto(updated);
  }

  async removeMember(
    actorId: string,
    organizationId: string,
    targetUserId: string,
  ): Promise<void> {
    await this.membership.requireAdmin(actorId, organizationId);
    const target = await this.requireTargetMember(organizationId, targetUserId);

    if (target.role === OrganizationRole.OWNER) {
      throw new ForbiddenException(MESSAGES.ORGANIZATION.CANNOT_REMOVE_OWNER);
    }
    await this.prisma.organizationMember.delete({ where: { id: target.id } });
  }

  async leave(userId: string, organizationId: string): Promise<void> {
    const membership = await this.membership.requireMember(userId, organizationId);
    if (membership.role === OrganizationRole.OWNER) {
      throw new BadRequestException(MESSAGES.ORGANIZATION.MUST_TRANSFER_OWNERSHIP);
    }
    await this.prisma.organizationMember.delete({ where: { id: membership.id } });
  }

  async transferOwnership(
    actorId: string,
    organizationId: string,
    dto: TransferOwnershipInput,
  ): Promise<Organization> {
    await this.membership.requireRole(actorId, organizationId, [OrganizationRole.OWNER]);
    const newOwner = await this.requireTargetMember(organizationId, dto.newOwnerId);

    const [, , organization] = await this.prisma.$transaction([
      this.prisma.organizationMember.update({
        where: { userId_organizationId: { userId: actorId, organizationId } },
        data: { role: OrganizationRole.ADMIN },
      }),
      this.prisma.organizationMember.update({
        where: { id: newOwner.id },
        data: { role: OrganizationRole.OWNER },
      }),
      this.prisma.organization.update({
        where: { id: organizationId },
        data: { ownerId: dto.newOwnerId },
      }),
    ]);
    return toOrganizationDto(organization);
  }

  private async requireTargetMember(organizationId: string, userId: string) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });
    if (!member) {
      throw new NotFoundException(MESSAGES.ORGANIZATION.NOT_A_MEMBER);
    }
    return member;
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || 'organization';
    const taken = await this.prisma.organization.findUnique({ where: { slug: base } });
    return taken ? `${base}-${randomSlugSuffix()}` : base;
  }
}
