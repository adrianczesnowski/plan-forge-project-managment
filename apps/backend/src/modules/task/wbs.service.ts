import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type Tx = Prisma.TransactionClient;

/** Maintains the auto-generated WBS numbering ("1", "1.2", "1.2.3"...) of a project. */
@Injectable()
export class WbsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recomputes wbsNumber for every task in the project (DFS over parent/order)
   * and persists only the rows that actually changed.
   */
  async renumberProject(projectId: string, tx: Tx = this.prisma): Promise<void> {
    const tasks = await tx.task.findMany({
      where: { projectId },
      select: { id: true, parentId: true, order: true, wbsNumber: true },
      orderBy: { order: 'asc' },
    });

    const byParent = new Map<string | null, typeof tasks>();
    for (const task of tasks) {
      const list = byParent.get(task.parentId) ?? [];
      list.push(task);
      byParent.set(task.parentId, list);
    }

    const updates: { id: string; wbsNumber: string }[] = [];
    const visit = (parentId: string | null, prefix: string) => {
      const children = byParent.get(parentId) ?? [];
      children.forEach((task, index) => {
        const number = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
        if (task.wbsNumber !== number) {
          updates.push({ id: task.id, wbsNumber: number });
        }
        visit(task.id, number);
      });
    };
    visit(null, '');

    for (const update of updates) {
      await tx.task.update({ where: { id: update.id }, data: { wbsNumber: update.wbsNumber } });
    }
  }

  /** Next order value among the siblings of the given parent. */
  async nextOrder(projectId: string, parentId: string | null, tx: Tx = this.prisma): Promise<number> {
    const last = await tx.task.findFirst({
      where: { projectId, parentId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return (last?.order ?? -1) + 1;
  }

  /**
   * Rewrites sibling orders so that `taskId` lands at `targetIndex`
   * within the children of `parentId`.
   */
  async placeAmongSiblings(
    projectId: string,
    parentId: string | null,
    taskId: string,
    targetIndex: number,
    tx: Tx,
  ): Promise<void> {
    const siblings = await tx.task.findMany({
      where: { projectId, parentId, id: { not: taskId } },
      orderBy: { order: 'asc' },
      select: { id: true },
    });

    const ids = siblings.map((s) => s.id);
    const index = Math.max(0, Math.min(targetIndex, ids.length));
    ids.splice(index, 0, taskId);

    for (let i = 0; i < ids.length; i++) {
      await tx.task.update({ where: { id: ids[i] as string }, data: { order: i } });
    }
  }
}
