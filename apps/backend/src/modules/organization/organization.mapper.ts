import type {
  Organization as PrismaOrganization,
  OrganizationMember as PrismaOrganizationMember,
  User as PrismaUser,
} from '@prisma/client';
import type { MyOrganization, Organization, OrganizationMember } from '@planforge/shared';
import { toUserSummary } from '../user/user.mapper';

export function toOrganizationDto(org: PrismaOrganization): Organization {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    ownerId: org.ownerId,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
  };
}

export function toMyOrganizationDto(
  org: PrismaOrganization,
  member: PrismaOrganizationMember,
): MyOrganization {
  return { ...toOrganizationDto(org), myRole: member.role };
}

export function toOrganizationMemberDto(
  member: PrismaOrganizationMember & { user: PrismaUser },
): OrganizationMember {
  return {
    id: member.id,
    userId: member.userId,
    organizationId: member.organizationId,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
    user: toUserSummary(member.user),
  };
}
