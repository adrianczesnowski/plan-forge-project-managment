import { format } from 'date-fns';
import type { Dependency, TaskTreeNode } from '@planforge/shared';
import type { GanttTask } from 'frappe-gantt';
import { flattenTree } from '@/entities/task/lib/flatten-tree';
import { computeCriticalPath } from './critical-path';

function toDateString(value: string): string {
  return format(new Date(value), 'yyyy-MM-dd');
}

export interface GanttData {
  tasks: GanttTask[];
  /**
   * Per-task CSS classes (parent / milestone / critical). Applied to the bar
   * wrappers after render — frappe-gantt's `custom_class` only accepts a single
   * token, so a milestone that is also on the critical path would crash it.
   */
  classMap: Record<string, string[]>;
}

/**
 * Maps the WBS tree onto frappe-gantt task rows (DFS order, like the WBS
 * table). Tasks without any dates are skipped — they have no bar to draw.
 */
export function buildGanttTasks(tree: TaskTreeNode[], dependencies: Dependency[]): GanttData {
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

  const classMap: Record<string, string[]> = {};

  const tasks = flat.map((task) => {
    const start = toDateString(task.startDate ?? task.endDate!);
    const end = toDateString(task.endDate ?? task.startDate!);
    const isParent = task.children.length > 0;

    const classes = [
      isParent && 'gantt-parent',
      task.isMilestone && 'gantt-milestone',
      critical.has(task.id) && 'gantt-critical',
    ].filter((c): c is string => Boolean(c));
    if (classes.length > 0) classMap[task.id] = classes;

    return {
      id: task.id,
      name: `${task.wbsNumber} ${task.title}`,
      start,
      end,
      progress: task.progress,
      dependencies: (predecessorsOf.get(task.id) ?? []).join(', '),
    } satisfies GanttTask;
  });

  return { tasks, classMap };
}
