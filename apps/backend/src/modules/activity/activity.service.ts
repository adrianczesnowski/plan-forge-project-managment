import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ActivityAction,
  Prisma,
  ProjectRole,
  type ActivityLog as PrismaActivityLog,
  type Task as PrismaTask,
  type User as PrismaUser,
} from '@prisma/client';
import type { ActivityLog, UpdateTaskInput } from '@planforge/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { MESSAGES } from '../../common/constants/messages';
import { ProjectAccessService } from '../project/project-access.service';
import { toUserSummary } from '../user/user.mapper';

const TASK_ENTITY = 'task';

interface FieldDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

function dayOf(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

/** Json column helper — store an explicit JSON null rather than a DB NULL. */
function toJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null || value === undefined
    ? Prisma.JsonNull
    : (value as Prisma.InputJsonValue);
}

/** Computes the per-field changes between the stored task and an update DTO. */
function buildTaskDiffs(old: PrismaTask, dto: UpdateTaskInput): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  const cmp = (field: string, oldV: unknown, newV: unknown) => {
    if (newV !== undefined && newV !== oldV) diffs.push({ field, oldValue: oldV, newValue: newV });
  };

  cmp('title', old.title, dto.title);
  cmp('status', old.status, dto.status);
  cmp('priority', old.priority, dto.priority);
  cmp('isMilestone', old.isMilestone, dto.isMilestone);
  cmp('progress', old.progress, dto.progress);
  cmp(
    'assigneeId',
    old.assigneeId,
    dto.assigneeId === undefined ? undefined : (dto.assigneeId ?? null),
  );
  if (dto.startDate !== undefined) {
    const next = dto.startDate ?? null;
    if (dayOf(old.startDate) !== next) {
      diffs.push({ field: 'startDate', oldValue: dayOf(old.startDate), newValue: next });
    }
  }
  if (dto.endDate !== undefined) {
    const next = dto.endDate ?? null;
    if (dayOf(old.endDate) !== next) {
      diffs.push({ field: 'endDate', oldValue: dayOf(old.endDate), newValue: next });
    }
  }
  return diffs;
}

function toActivityDto(log: PrismaActivityLog & { user: PrismaUser | null }): ActivityLog {
  return {
    id: log.id,
    userId: log.userId,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    field: log.field,
    oldValue: log.oldValue ?? null,
    newValue: log.newValue ?? null,
    projectId: log.projectId,
    createdAt: log.createdAt.toISOString(),
    user: log.user ? toUserSummary(log.user) : null,
  };
}

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
  ) {}

  /** Activity feed for a single task (newest first). */
  async listByTask(userId: string, taskId: string): Promise<ActivityLog[]> {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException(MESSAGES.TASK.NOT_FOUND);
    await this.access.require(userId, task.projectId, ProjectRole.VIEWER);

    const logs = await this.prisma.activityLog.findMany({
      where: { entityType: TASK_ENTITY, entityId: taskId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return logs.map(toActivityDto);
  }

  // ── Recording (best-effort: never breaks the underlying task operation) ──

  async recordTaskCreated(userId: string, task: PrismaTask): Promise<void> {
    await this.safeCreate([
      {
        userId,
        action: ActivityAction.CREATED,
        entityType: TASK_ENTITY,
        entityId: task.id,
        projectId: task.projectId,
      },
    ]);
  }

  async recordTaskUpdated(userId: string, old: PrismaTask, dto: UpdateTaskInput): Promise<void> {
    const diffs = buildTaskDiffs(old, dto);
    if (diffs.length === 0) return;
    await this.safeCreate(
      diffs.map((d) => ({
        userId,
        action: ActivityAction.UPDATED,
        entityType: TASK_ENTITY,
        entityId: old.id,
        projectId: old.projectId,
        field: d.field,
        oldValue: toJson(d.oldValue),
        newValue: toJson(d.newValue),
      })),
    );
  }

  async recordTaskDeleted(userId: string, task: PrismaTask): Promise<void> {
    await this.safeCreate([
      {
        userId,
        action: ActivityAction.DELETED,
        entityType: TASK_ENTITY,
        entityId: task.id,
        projectId: task.projectId,
      },
    ]);
  }

  private async safeCreate(data: Prisma.ActivityLogCreateManyInput[]): Promise<void> {
    try {
      await this.prisma.activityLog.createMany({ data });
    } catch (error) {
      // Activity logging is secondary — log and move on, never fail the request.
      this.logger.warn(`Failed to record activity: ${String(error)}`);
    }
  }
}
