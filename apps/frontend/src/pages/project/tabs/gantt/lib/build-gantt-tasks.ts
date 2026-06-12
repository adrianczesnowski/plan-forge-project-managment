import { format } from 'date-fns';
import type { Dependency, TaskTreeNode } from '@planforge/shared';
import type { GanttTask } from 'frappe-gantt';
import { flattenTree } from '@/entities/task/lib/flatten-tree';
import { computeCriticalPath } from './critical-path';

function toDateString(value: string): string {
  return format(new Date(value), 'yyyy-MM-dd');
}

/**
 * Maps the WBS tree onto frappe-gantt task rows (DFS order, like the WBS
 * table). Tasks without any dates are skipped — they have no bar to draw.
 */
export function buildGanttTasks(tree: TaskTreeNode[], dependencies: Dependency[]): GanttTask[] {
  const flat = flattenTree(tree).filter((task) => task.startDate ?? task.endDate);
  const visibleIds = new Set(flat.map((t) => t.id));
  const critical = computeCriticalPath(flat, dependencies);

  const predecessorsOf = new Map<string, string[]>();
  for (const dep of dependencies) {
    if (!visibleIds.has(dep.predecessorId) || !visibleIds.has(dep.successorId)) continue;
    predecessorsOf.set(dep.successorId, [
      ...(predecessorsOf.get(dep.successorId) ?? []),
      dep.predecessorId,
    ]);
  }

  return flat.map((task) => {
    const start = toDateString(task.startDate ?? task.endDate!);
    const end = toDateString(task.endDate ?? task.startDate!);
    const isParent = task.children.length > 0;

    const classes = [
      isParent && 'gantt-parent',
      task.isMilestone && 'gantt-milestone',
      critical.has(task.id) && 'gantt-critical',
    ].filter(Boolean);

    return {
      id: task.id,
      name: `${task.wbsNumber} ${task.title}`,
      start,
      end,
      progress: task.progress,
      dependencies: (predecessorsOf.get(task.id) ?? []).join(', '),
      custom_class: classes.join(' ') || undefined,
    } satisfies GanttTask;
  });
}
