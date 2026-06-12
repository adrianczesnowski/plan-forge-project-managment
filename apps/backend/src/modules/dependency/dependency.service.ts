import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectRole, type Dependency as PrismaDependency } from '@prisma/client';
import type { CreateDependencyInput, Dependency } from '@planforge/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { MESSAGES } from '../../common/constants/messages';
import { ProjectAccessService } from '../project/project-access.service';

function toDependencyDto(dependency: PrismaDependency): Dependency {
  return {
    id: dependency.id,
    predecessorId: dependency.predecessorId,
    successorId: dependency.successorId,
    type: dependency.type,
    lag: dependency.lag,
  };
}

@Injectable()
export class DependencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
  ) {}

  async create(userId: string, dto: CreateDependencyInput): Promise<Dependency> {
    if (dto.predecessorId === dto.successorId) {
      throw new BadRequestException(MESSAGES.DEPENDENCY.SELF);
    }

    const [predecessor, successor] = await Promise.all([
      this.prisma.task.findUnique({ where: { id: dto.predecessorId } }),
      this.prisma.task.findUnique({ where: { id: dto.successorId } }),
    ]);
    if (!predecessor || !successor) {
      throw new NotFoundException(MESSAGES.TASK.NOT_FOUND);
    }
    if (predecessor.projectId !== successor.projectId) {
      throw new BadRequestException(MESSAGES.DEPENDENCY.DIFFERENT_PROJECT);
    }
    await this.access.require(userId, predecessor.projectId, ProjectRole.MEMBER);

    const existing = await this.prisma.dependency.findFirst({
      where: {
        OR: [
          { predecessorId: dto.predecessorId, successorId: dto.successorId },
          { predecessorId: dto.successorId, successorId: dto.predecessorId },
        ],
      },
    });
    if (existing) {
      throw new ConflictException(MESSAGES.DEPENDENCY.ALREADY_EXISTS);
    }

    await this.assertNoCycle(predecessor.projectId, dto.predecessorId, dto.successorId);

    const dependency = await this.prisma.dependency.create({
      data: {
        predecessorId: dto.predecessorId,
        successorId: dto.successorId,
        type: dto.type,
        lag: dto.lag,
      },
    });
    return toDependencyDto(dependency);
  }

  async listByProject(userId: string, projectId: string): Promise<Dependency[]> {
    await this.access.require(userId, projectId, ProjectRole.VIEWER);
    const dependencies = await this.prisma.dependency.findMany({
      where: { predecessor: { projectId } },
      orderBy: { id: 'asc' },
    });
    return dependencies.map(toDependencyDto);
  }

  async listByTask(userId: string, taskId: string): Promise<Dependency[]> {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(MESSAGES.TASK.NOT_FOUND);
    }
    await this.access.require(userId, task.projectId, ProjectRole.VIEWER);
    const dependencies = await this.prisma.dependency.findMany({
      where: { OR: [{ predecessorId: taskId }, { successorId: taskId }] },
      orderBy: { id: 'asc' },
    });
    return dependencies.map(toDependencyDto);
  }

  async delete(userId: string, dependencyId: string): Promise<void> {
    const dependency = await this.prisma.dependency.findUnique({
      where: { id: dependencyId },
      include: { predecessor: { select: { projectId: true } } },
    });
    if (!dependency) {
      throw new NotFoundException(MESSAGES.DEPENDENCY.NOT_FOUND);
    }
    await this.access.require(userId, dependency.predecessor.projectId, ProjectRole.MEMBER);
    await this.prisma.dependency.delete({ where: { id: dependencyId } });
  }

  /**
   * BFS over the project's dependency graph: adding predecessor → successor
   * creates a cycle iff predecessor is already reachable from successor.
   */
  private async assertNoCycle(projectId: string, predecessorId: string, successorId: string) {
    const edges = await this.prisma.dependency.findMany({
      where: { predecessor: { projectId } },
      select: { predecessorId: true, successorId: true },
    });

    const adjacency = new Map<string, string[]>();
    for (const edge of edges) {
      const next = adjacency.get(edge.predecessorId) ?? [];
      next.push(edge.successorId);
      adjacency.set(edge.predecessorId, next);
    }

    const visited = new Set<string>([successorId]);
    const queue = [successorId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === predecessorId) {
        throw new BadRequestException(MESSAGES.DEPENDENCY.CYCLE);
      }
      for (const next of adjacency.get(current) ?? []) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }
  }
}
