import type {
  Project as PrismaProject,
  ProjectMember as PrismaProjectMember,
  ProjectRole,
  User as PrismaUser,
} from '@prisma/client';
import type { Project, ProjectMember, ProjectWithRole } from '@planforge/shared';
import { toUserSummary } from '../user/user.mapper';

export function toProjectDto(project: PrismaProject): Project {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    type: project.type,
    status: project.status,
    startDate: project.startDate?.toISOString() ?? null,
    endDate: project.endDate?.toISOString() ?? null,
    spaceId: project.spaceId,
    createdById: project.createdById,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export function toProjectWithRole(project: PrismaProject, myRole: ProjectRole): ProjectWithRole {
  return { ...toProjectDto(project), myRole };
}

export function toProjectMemberDto(
  member: PrismaProjectMember & { user: PrismaUser },
): ProjectMember {
  return {
    id: member.id,
    userId: member.userId,
    projectId: member.projectId,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
    user: toUserSummary(member.user),
  };
}
