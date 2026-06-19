import { Injectable } from '@nestjs/common';
import { ProjectRole, TaskStatus } from '@prisma/client';
import type {
  DashboardMilestone,
  DashboardTeamMember,
  ProjectDashboard,
  ScheduleHealth,
} from '@planforge/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAccessService } from '../project/project-access.service';
import { buildTaskTree } from '../task/task.mapper';

const DAY_MS = 24 * 60 * 60 * 1000;

function dayIndex(date: Date): number {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / DAY_MS);
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
  ) {}

  async getProjectDashboard(userId: string, projectId: string): Promise<ProjectDashboard> {
    await this.access.require(userId, projectId, ProjectRole.VIEWER);

    const project = await this.prisma.project.findUniqueOrThrow({ where: { id: projectId } });
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      include: { assignee: true },
      orderBy: { order: 'asc' },
    });

    const tree = buildTaskTree(tasks);
    const parentIds = new Set(tasks.map((t) => t.parentId).filter((id): id is string => Boolean(id)));
    const leaves = tasks.filter((t) => !parentIds.has(t.id));
    const today = dayIndex(new Date());

    // ── Task counts (over leaf work items) ──
    const counts = { total: leaves.length, done: 0, inProgress: 0, inReview: 0, todo: 0, cancelled: 0 };
    let progressSum = 0;
    let overdueCount = 0;
    for (const t of leaves) {
      progressSum += t.progress;
      switch (t.status) {
        case TaskStatus.DONE: counts.done++; break;
        case TaskStatus.IN_PROGRESS: counts.inProgress++; break;
        case TaskStatus.IN_REVIEW: counts.inReview++; break;
        case TaskStatus.TODO: counts.todo++; break;
        case TaskStatus.CANCELLED: counts.cancelled++; break;
      }
      const active = t.status !== TaskStatus.DONE && t.status !== TaskStatus.CANCELLED;
      if (active && t.endDate && dayIndex(t.endDate) < today) overdueCount++;
    }
    const overallProgress = leaves.length > 0 ? Math.round(progressSum / leaves.length) : 0;

    // ── Phases (top-level tasks with rolled-up progress/dates) ──
    const phases = tree.map((node) => ({
      id: node.id,
      title: node.title,
      status: node.status,
      progress: node.progress,
      startDate: node.startDate,
      endDate: node.endDate,
    }));

    // ── Milestones (sorted by date) ──
    const milestones: DashboardMilestone[] = tasks
      .filter((t) => t.isMilestone)
      .map((t) => {
        const date = t.endDate ?? t.startDate;
        return {
          id: t.id,
          title: t.title,
          status: t.status,
          date: date ? date.toISOString() : null,
          daysLeft: date ? dayIndex(date) - today : null,
        };
      })
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));

    // ── Team workload (leaf tasks grouped by assignee) ──
    const teamMap = new Map<string, DashboardTeamMember>();
    for (const t of leaves) {
      if (!t.assignee) continue;
      const entry = teamMap.get(t.assignee.id) ?? {
        userId: t.assignee.id,
        firstName: t.assignee.firstName,
        lastName: t.assignee.lastName,
        taskCount: 0,
      };
      entry.taskCount++;
      teamMap.set(t.assignee.id, entry);
    }
    const team = [...teamMap.values()].sort((a, b) => b.taskCount - a.taskCount);

    // ── Schedule health ──
    let scheduleHealth: ScheduleHealth = 'NO_DATES';
    let timeElapsed: number | null = null;
    if (project.startDate && project.endDate) {
      const start = dayIndex(project.startDate);
      const end = dayIndex(project.endDate);
      const span = end - start;
      const elapsed = span > 0 ? Math.min(100, Math.max(0, Math.round(((today - start) / span) * 100))) : 0;
      timeElapsed = elapsed;
      // On track when progress keeps up with elapsed time (5pp grace).
      scheduleHealth = overallProgress + 5 >= elapsed ? 'ON_TRACK' : 'AT_RISK';
    }

    return {
      overallProgress,
      taskCounts: counts,
      overdueCount,
      milestoneCount: milestones.length,
      scheduleHealth,
      timeElapsed,
      phases,
      milestones,
      team,
    };
  }
}
