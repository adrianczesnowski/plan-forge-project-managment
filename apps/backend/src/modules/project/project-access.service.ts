import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRole, SpaceRole, type Project } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MESSAGES } from '../../common/constants/messages';
import { SpaceAccessService } from '../space/space-access.service';

export interface ProjectAccess {
  project: Project;
  /** Effective role after inheritance (org/space admins → OWNER/ADMIN). */
  role: ProjectRole;
  /** True when the role comes from the org or space level. */
  inherited: boolean;
}

const ROLE_WEIGHT: Record<ProjectRole, number> = { OWNER: 4, ADMIN: 3, MEMBER: 2, VIEWER: 1 };

/**
 * Effective project role:
 * - org OWNER/ADMIN and space OWNER → project OWNER
 * - space ADMIN → project ADMIN
 * - space MEMBER → explicit project_members row (or no access)
 */
@Injectable()
export class ProjectAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spaceAccess: SpaceAccessService,
  ) {}

  async resolve(userId: string, projectId: string): Promise<ProjectAccess | null> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return null;

    const spaceAccess = await this.spaceAccess.resolve(userId, project.spaceId);
    if (!spaceAccess) return null;

    if (spaceAccess.role === SpaceRole.OWNER) {
      return { project, role: ProjectRole.OWNER, inherited: true };
    }
    if (spaceAccess.role === SpaceRole.ADMIN) {
      return { project, role: ProjectRole.ADMIN, inherited: true };
    }

    const member = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    return member ? { project, role: member.role, inherited: false } : null;
  }

  /** 404 when invisible, 403 when the effective role is below the minimum. */
  async require(userId: string, projectId: string, minimumRole: ProjectRole): Promise<ProjectAccess> {
    const access = await this.resolve(userId, projectId);
    if (!access) {
      throw new NotFoundException(MESSAGES.PROJECT.NOT_FOUND);
    }
    if (ROLE_WEIGHT[access.role] < ROLE_WEIGHT[minimumRole]) {
      throw new ForbiddenException(MESSAGES.PROJECT.FORBIDDEN);
    }
    return access;
  }
}
