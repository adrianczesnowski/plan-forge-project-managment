import type {
  Space as PrismaSpace,
  SpaceMember as PrismaSpaceMember,
  SpaceRole,
  User as PrismaUser,
} from '@prisma/client';
import type { Space, SpaceMember, SpaceWithRole } from '@planforge/shared';
import { toUserSummary } from '../user/user.mapper';

export function toSpaceDto(space: PrismaSpace): Space {
  return {
    id: space.id,
    name: space.name,
    description: space.description,
    color: space.color,
    icon: space.icon,
    organizationId: space.organizationId,
    createdById: space.createdById,
    order: space.order,
    createdAt: space.createdAt.toISOString(),
  };
}

export function toSpaceWithRole(space: PrismaSpace, myRole: SpaceRole): SpaceWithRole {
  return { ...toSpaceDto(space), myRole };
}

export function toSpaceMemberDto(member: PrismaSpaceMember & { user: PrismaUser }): SpaceMember {
  return {
    id: member.id,
    userId: member.userId,
    spaceId: member.spaceId,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
    user: toUserSummary(member.user),
  };
}
