import type { Task as PrismaTask, User as PrismaUser } from '@prisma/client';
import { TaskStatus } from '@prisma/client';
import type { Task, TaskTreeNode } from '@planforge/shared';
import { toUserSummary } from '../user/user.mapper';

export type TaskWithAssignee = PrismaTask & { assignee: PrismaUser | null };

export function toTaskDto(task: TaskWithAssignee): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    startDate: task.startDate?.toISOString() ?? null,
    endDate: task.endDate?.toISOString() ?? null,
    estimatedHours: task.estimatedHours ? Number(task.estimatedHours) : null,
    progress: task.progress,
    projectId: task.projectId,
    parentId: task.parentId,
    assigneeId: task.assigneeId,
    createdById: task.createdById,
    wbsNumber: task.wbsNumber,
    order: task.order,
    isMilestone: task.isMilestone,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    assignee: task.assignee ? toUserSummary(task.assignee) : null,
  };
}

/**
 * Builds the WBS tree and rolls parent values up from their subtree:
 * progress = % of DONE leaf descendants, dates = min(start)/max(end).
 */
export function buildTaskTree(tasks: TaskWithAssignee[]): TaskTreeNode[] {
  const nodes = new Map<string, TaskTreeNode>();
  for (const task of tasks) {
    nodes.set(task.id, { ...toTaskDto(task), children: [] });
  }

  const roots: TaskTreeNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortByOrder = (list: TaskTreeNode[]) => list.sort((a, b) => a.order - b.order);
  const rollUp = (node: TaskTreeNode): { leaves: number; done: number } => {
    if (node.children.length === 0) {
      return { leaves: 1, done: node.status === TaskStatus.DONE ? 1 : 0 };
    }

    sortByOrder(node.children);
    let leaves = 0;
    let done = 0;
    let minStart: string | null = null;
    let maxEnd: string | null = null;

    for (const child of node.children) {
      const stats = rollUp(child);
      leaves += stats.leaves;
      done += stats.done;
      if (child.startDate && (!minStart || child.startDate < minStart)) minStart = child.startDate;
      if (child.endDate && (!maxEnd || child.endDate > maxEnd)) maxEnd = child.endDate;
    }

    node.progress = leaves > 0 ? Math.round((done / leaves) * 100) : 0;
    node.startDate = minStart ?? node.startDate;
    node.endDate = maxEnd ?? node.endDate;
    return { leaves, done };
  };

  sortByOrder(roots);
  roots.forEach(rollUp);
  return roots;
}
