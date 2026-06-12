import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRole, TaskStatus, type Prisma, type Task as PrismaTask } from '@prisma/client';
import type {
  BulkTaskActionInput,
  CreateTaskInput,
  MoveTaskInput,
  ReorderTasksInput,
  Task,
  TaskTreeNode,
  UpdateTaskInput,
} from '@planforge/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { MESSAGES } from '../../common/constants/messages';
import { ProjectAccessService } from '../project/project-access.service';
import { WbsService } from './wbs.service';
import { buildTaskTree, toTaskDto } from './task.mapper';

const ASSIGNEE_INCLUDE = { assignee: true } as const;

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
    private readonly wbs: WbsService,
  ) {}

  async create(userId: string, dto: CreateTaskInput): Promise<Task> {
    await this.access.require(userId, dto.projectId, ProjectRole.MEMBER);

    if (dto.parentId) {
      await this.requireParentInProject(dto.parentId, dto.projectId);
    }
    if (dto.assigneeId) {
      await this.requireAssigneeAccess(dto.assigneeId, dto.projectId);
    }

    const task = await this.prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          title: dto.title,
          description: dto.description,
          status: dto.status,
          priority: dto.priority,
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          estimatedHours: dto.estimatedHours,
          projectId: dto.projectId,
          parentId: dto.parentId ?? null,
          assigneeId: dto.assigneeId ?? null,
          createdById: userId,
          isMilestone: dto.isMilestone,
          progress: dto.status === TaskStatus.DONE ? 100 : 0,
          order: await this.wbs.nextOrder(dto.projectId, dto.parentId ?? null, tx),
        },
        include: ASSIGNEE_INCLUDE,
      });
      await this.wbs.renumberProject(dto.projectId, tx);
      return created;
    });

    return this.reload(task.id);
  }

  /** Full WBS tree of a project (parents get rolled-up progress and dates). */
  async listTree(userId: string, projectId: string): Promise<TaskTreeNode[]> {
    await this.access.require(userId, projectId, ProjectRole.VIEWER);
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      include: ASSIGNEE_INCLUDE,
      orderBy: { order: 'asc' },
    });
    return buildTaskTree(tasks);
  }

  async getById(userId: string, taskId: string): Promise<Task> {
    const task = await this.requireTask(taskId);
    await this.access.require(userId, task.projectId, ProjectRole.VIEWER);
    return this.reload(taskId);
  }

  async update(userId: string, taskId: string, dto: UpdateTaskInput): Promise<Task> {
    const task = await this.requireTask(taskId);
    await this.access.require(userId, task.projectId, ProjectRole.MEMBER);

    if (dto.assigneeId) {
      await this.requireAssigneeAccess(dto.assigneeId, task.projectId);
    }

    const data: Prisma.TaskUpdateInput = {
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      isMilestone: dto.isMilestone,
      estimatedHours: dto.estimatedHours,
      progress: dto.progress,
      startDate: dto.startDate === undefined ? undefined : dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate === undefined ? undefined : dto.endDate ? new Date(dto.endDate) : null,
      assignee:
        dto.assigneeId === undefined
          ? undefined
          : dto.assigneeId
            ? { connect: { id: dto.assigneeId } }
            : { disconnect: true },
    };

    // Status drives progress unless the caller sets it explicitly.
    if (dto.progress === undefined && dto.status) {
      if (dto.status === TaskStatus.DONE) data.progress = 100;
      else if (task.status === TaskStatus.DONE) data.progress = 0;
    }

    await this.prisma.task.update({ where: { id: taskId }, data });
    return this.reload(taskId);
  }

  /** Deletes the task with its whole subtree (DB cascade) and renumbers. */
  async delete(userId: string, taskId: string): Promise<void> {
    const task = await this.requireTask(taskId);
    await this.access.require(userId, task.projectId, ProjectRole.MEMBER);

    await this.prisma.$transaction(async (tx) => {
      await tx.task.delete({ where: { id: taskId } });
      await this.wbs.renumberProject(task.projectId, tx);
    });
  }

  /** Moves the task to a new parent and/or position; rejects cycles. */
  async move(userId: string, taskId: string, dto: MoveTaskInput): Promise<TaskTreeNode[]> {
    const task = await this.requireTask(taskId);
    await this.access.require(userId, task.projectId, ProjectRole.MEMBER);

    if (dto.parentId) {
      await this.requireParentInProject(dto.parentId, task.projectId);
      await this.assertNoCycle(taskId, dto.parentId);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.task.update({ where: { id: taskId }, data: { parentId: dto.parentId } });
      await this.wbs.placeAmongSiblings(task.projectId, dto.parentId, taskId, dto.order, tx);
      await this.wbs.renumberProject(task.projectId, tx);
    });

    return this.listTree(userId, task.projectId);
  }

  /** Reorders the children of one parent according to the given id sequence. */
  async reorder(userId: string, dto: ReorderTasksInput): Promise<TaskTreeNode[]> {
    await this.access.require(userId, dto.projectId, ProjectRole.MEMBER);

    const children = await this.prisma.task.findMany({
      where: { projectId: dto.projectId, parentId: dto.parentId },
      select: { id: true },
    });
    const childIds = new Set(children.map((c) => c.id));
    if (dto.taskIds.length !== childIds.size || dto.taskIds.some((id) => !childIds.has(id))) {
      throw new BadRequestException(MESSAGES.TASK.NOT_IN_PROJECT);
    }

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < dto.taskIds.length; i++) {
        await tx.task.update({ where: { id: dto.taskIds[i] as string }, data: { order: i } });
      }
      await this.wbs.renumberProject(dto.projectId, tx);
    });

    return this.listTree(userId, dto.projectId);
  }

  async bulk(userId: string, dto: BulkTaskActionInput): Promise<{ affected: number }> {
    const tasks = await this.prisma.task.findMany({
      where: { id: { in: dto.taskIds } },
      select: { id: true, projectId: true },
    });
    if (tasks.length !== dto.taskIds.length) {
      throw new NotFoundException(MESSAGES.TASK.NOT_FOUND);
    }

    const projectIds = [...new Set(tasks.map((t) => t.projectId))];
    if (projectIds.length !== 1) {
      throw new BadRequestException(MESSAGES.TASK.NOT_IN_PROJECT);
    }
    const projectId = projectIds[0] as string;
    await this.access.require(userId, projectId, ProjectRole.MEMBER);

    const { action } = dto;
    switch (action.type) {
      case 'SET_STATUS':
        await this.prisma.task.updateMany({
          where: { id: { in: dto.taskIds } },
          data: {
            status: action.status,
            ...(action.status === TaskStatus.DONE ? { progress: 100 } : {}),
          },
        });
        break;
      case 'SET_PRIORITY':
        await this.prisma.task.updateMany({
          where: { id: { in: dto.taskIds } },
          data: { priority: action.priority },
        });
        break;
      case 'SET_ASSIGNEE':
        if (action.assigneeId) {
          await this.requireAssigneeAccess(action.assigneeId, projectId);
        }
        await this.prisma.task.updateMany({
          where: { id: { in: dto.taskIds } },
          data: { assigneeId: action.assigneeId },
        });
        break;
      case 'DELETE':
        await this.prisma.$transaction(async (tx) => {
          await tx.task.deleteMany({ where: { id: { in: dto.taskIds } } });
          await this.wbs.renumberProject(projectId, tx);
        });
        break;
    }

    return { affected: dto.taskIds.length };
  }

  private async reload(taskId: string): Promise<Task> {
    const task = await this.prisma.task.findUniqueOrThrow({
      where: { id: taskId },
      include: ASSIGNEE_INCLUDE,
    });
    return toTaskDto(task);
  }

  private async requireTask(taskId: string): Promise<PrismaTask> {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(MESSAGES.TASK.NOT_FOUND);
    }
    return task;
  }

  private async requireParentInProject(parentId: string, projectId: string): Promise<void> {
    const parent = await this.prisma.task.findUnique({ where: { id: parentId } });
    if (!parent) {
      throw new NotFoundException(MESSAGES.TASK.PARENT_NOT_FOUND);
    }
    if (parent.projectId !== projectId) {
      throw new BadRequestException(MESSAGES.TASK.PARENT_DIFFERENT_PROJECT);
    }
  }

  /** Walks up from the target parent — the moved task must not be an ancestor. */
  private async assertNoCycle(taskId: string, newParentId: string): Promise<void> {
    let currentId: string | null = newParentId;
    while (currentId) {
      if (currentId === taskId) {
        throw new BadRequestException(MESSAGES.TASK.CYCLIC_HIERARCHY);
      }
      const current: { parentId: string | null } | null = await this.prisma.task.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
      currentId = current?.parentId ?? null;
    }
  }

  private async requireAssigneeAccess(assigneeId: string, projectId: string): Promise<void> {
    const access = await this.access.resolve(assigneeId, projectId);
    if (!access) {
      throw new BadRequestException(MESSAGES.TASK.ASSIGNEE_NO_ACCESS);
    }
  }
}
