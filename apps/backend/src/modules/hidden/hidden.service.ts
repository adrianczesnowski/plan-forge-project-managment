import { Injectable } from '@nestjs/common';
import { FavoriteEntityType, ProjectRole, SpaceRole } from '@prisma/client';
import type { AddHiddenInput, HiddenItem } from '@planforge/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAccessService } from '../project/project-access.service';
import { SpaceAccessService } from '../space/space-access.service';

@Injectable()
export class HiddenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly spaceAccess: SpaceAccessService,
  ) {}

  /** The user's hidden items enriched with each target's name (dangling ones dropped). */
  async list(userId: string): Promise<HiddenItem[]> {
    const hidden = await this.prisma.userHiddenItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    const projectIds = hidden.filter((h) => h.entityType === 'PROJECT').map((h) => h.entityId);
    const spaceIds = hidden.filter((h) => h.entityType === 'SPACE').map((h) => h.entityId);

    const [projects, spaces] = await Promise.all([
      this.prisma.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, name: true } }),
      this.prisma.space.findMany({ where: { id: { in: spaceIds } }, select: { id: true, name: true, color: true } }),
    ]);
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    const spaceMap = new Map(spaces.map((s) => [s.id, s]));

    const items: HiddenItem[] = [];
    for (const h of hidden) {
      if (h.entityType === 'PROJECT') {
        const project = projectMap.get(h.entityId);
        if (project) {
          items.push({
            id: h.id,
            entityType: h.entityType,
            entityId: h.entityId,
            name: project.name,
            color: null,
            createdAt: h.createdAt.toISOString(),
          });
        }
      } else {
        const space = spaceMap.get(h.entityId);
        if (space) {
          items.push({
            id: h.id,
            entityType: h.entityType,
            entityId: h.entityId,
            name: space.name,
            color: space.color,
            createdAt: h.createdAt.toISOString(),
          });
        }
      }
    }
    return items;
  }

  async add(userId: string, dto: AddHiddenInput): Promise<void> {
    await this.requireAccess(userId, dto);
    await this.prisma.userHiddenItem.upsert({
      where: {
        userId_entityType_entityId: {
          userId,
          entityType: dto.entityType as FavoriteEntityType,
          entityId: dto.entityId,
        },
      },
      update: {},
      create: { userId, entityType: dto.entityType as FavoriteEntityType, entityId: dto.entityId },
    });
  }

  async remove(userId: string, entityType: string, entityId: string): Promise<void> {
    await this.prisma.userHiddenItem.deleteMany({
      where: { userId, entityType: entityType as FavoriteEntityType, entityId },
    });
  }

  /** A user may only hide entities they can access (require throws otherwise). */
  private async requireAccess(userId: string, dto: AddHiddenInput): Promise<void> {
    if (dto.entityType === 'PROJECT') {
      await this.projectAccess.require(userId, dto.entityId, ProjectRole.VIEWER);
    } else {
      await this.spaceAccess.require(userId, dto.entityId, SpaceRole.MEMBER);
    }
  }
}
