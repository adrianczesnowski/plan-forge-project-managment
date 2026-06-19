import { Injectable } from '@nestjs/common';
import { FavoriteEntityType, ProjectRole, SpaceRole } from '@prisma/client';
import type { AddFavoriteInput, FavoriteItem } from '@planforge/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAccessService } from '../project/project-access.service';
import { SpaceAccessService } from '../space/space-access.service';

@Injectable()
export class FavoriteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
    private readonly spaceAccess: SpaceAccessService,
  ) {}

  /** The user's favorites enriched with each target's name (dangling ones dropped). */
  async list(userId: string): Promise<FavoriteItem[]> {
    const favorites = await this.prisma.userFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    const projectIds = favorites.filter((f) => f.entityType === 'PROJECT').map((f) => f.entityId);
    const spaceIds = favorites.filter((f) => f.entityType === 'SPACE').map((f) => f.entityId);

    const [projects, spaces] = await Promise.all([
      this.prisma.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, name: true } }),
      this.prisma.space.findMany({ where: { id: { in: spaceIds } }, select: { id: true, name: true, color: true } }),
    ]);
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    const spaceMap = new Map(spaces.map((s) => [s.id, s]));

    const items: FavoriteItem[] = [];
    for (const fav of favorites) {
      if (fav.entityType === 'PROJECT') {
        const project = projectMap.get(fav.entityId);
        if (project) {
          items.push({
            id: fav.id,
            entityType: fav.entityType,
            entityId: fav.entityId,
            name: project.name,
            color: null,
            createdAt: fav.createdAt.toISOString(),
          });
        }
      } else {
        const space = spaceMap.get(fav.entityId);
        if (space) {
          items.push({
            id: fav.id,
            entityType: fav.entityType,
            entityId: fav.entityId,
            name: space.name,
            color: space.color,
            createdAt: fav.createdAt.toISOString(),
          });
        }
      }
    }
    return items;
  }

  async add(userId: string, dto: AddFavoriteInput): Promise<void> {
    await this.requireAccess(userId, dto);
    await this.prisma.userFavorite.upsert({
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
    await this.prisma.userFavorite.deleteMany({
      where: { userId, entityType: entityType as FavoriteEntityType, entityId },
    });
  }

  /** A user may only favorite entities they can access (require throws otherwise). */
  private async requireAccess(userId: string, dto: AddFavoriteInput): Promise<void> {
    if (dto.entityType === 'PROJECT') {
      await this.projectAccess.require(userId, dto.entityId, ProjectRole.VIEWER);
    } else {
      await this.spaceAccess.require(userId, dto.entityId, SpaceRole.MEMBER);
    }
  }
}
