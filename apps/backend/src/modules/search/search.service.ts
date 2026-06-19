import { Injectable } from '@nestjs/common';
import { OrganizationRole, SpaceRole } from '@prisma/client';
import type { SearchResults } from '@planforge/shared';
import { PrismaService } from '../../prisma/prisma.service';

const LIMIT = 8;

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  /** Global search over the entities the user can actually access. */
  async search(userId: string, rawQuery: string): Promise<SearchResults> {
    const q = rawQuery.trim();
    if (q.length < 2) return { tasks: [], projects: [], spaces: [] };

    // ── Resolve the user's access scope ──
    const [orgMembers, spaceMembers, projectMembers] = await Promise.all([
      this.prisma.organizationMember.findMany({ where: { userId } }),
      this.prisma.spaceMember.findMany({ where: { userId } }),
      this.prisma.projectMember.findMany({ where: { userId }, select: { projectId: true } }),
    ]);

    const adminOrgIds = orgMembers
      .filter((m) => m.role !== OrganizationRole.MEMBER)
      .map((m) => m.organizationId);
    const memberSpaceIds = spaceMembers.map((m) => m.spaceId);
    const adminSpaceIds = spaceMembers
      .filter((m) => m.role !== SpaceRole.MEMBER)
      .map((m) => m.spaceId);
    const projectMemberIds = projectMembers.map((m) => m.projectId);

    const contains = { contains: q, mode: 'insensitive' as const };

    // Spaces: org admin (all) or explicit space member.
    const spaces = await this.prisma.space.findMany({
      where: {
        name: contains,
        OR: [{ organizationId: { in: adminOrgIds } }, { id: { in: memberSpaceIds } }],
      },
      select: { id: true, name: true, color: true },
      take: LIMIT,
      orderBy: { name: 'asc' },
    });

    // Projects: org admin, space owner/admin, or explicit project member.
    const projectAccess = {
      OR: [
        { space: { organizationId: { in: adminOrgIds } } },
        { spaceId: { in: adminSpaceIds } },
        { id: { in: projectMemberIds } },
      ],
    };
    const projects = await this.prisma.project.findMany({
      where: { name: contains, ...projectAccess },
      select: { id: true, name: true, space: { select: { name: true } } },
      take: LIMIT,
      orderBy: { name: 'asc' },
    });

    // Tasks: within any accessible project.
    const accessibleProjects = await this.prisma.project.findMany({
      where: projectAccess,
      select: { id: true },
    });
    const accessibleProjectIds = accessibleProjects.map((p) => p.id);
    const tasks = await this.prisma.task.findMany({
      where: { title: contains, projectId: { in: accessibleProjectIds } },
      select: { id: true, title: true, wbsNumber: true, projectId: true, project: { select: { name: true } } },
      take: LIMIT,
      orderBy: { updatedAt: 'desc' },
    });

    return {
      spaces: spaces.map((s) => ({ id: s.id, name: s.name, color: s.color })),
      projects: projects.map((p) => ({ id: p.id, name: p.name, spaceName: p.space.name })),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        wbsNumber: t.wbsNumber,
        projectId: t.projectId,
        projectName: t.project.name,
      })),
    };
  }
}
