import type { TaskPriority, TaskStatus, TaskTreeNode } from '@planforge/shared';

export interface TaskFilters {
  search: string;
  statuses: TaskStatus[];
  priorities: TaskPriority[];
  assigneeId: string | null;
}

export const EMPTY_FILTERS: TaskFilters = {
  search: '',
  statuses: [],
  priorities: [],
  assigneeId: null,
};

export function hasActiveFilters(filters: TaskFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.statuses.length > 0 ||
    filters.priorities.length > 0 ||
    filters.assigneeId !== null
  );
}

export function matchesFilters(task: TaskTreeNode, filters: TaskFilters): boolean {
  const search = filters.search.trim().toLowerCase();
  if (search && !task.title.toLowerCase().includes(search)) return false;
  if (filters.statuses.length > 0 && !filters.statuses.includes(task.status)) return false;
  if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) return false;
  if (filters.assigneeId && task.assigneeId !== filters.assigneeId) return false;
  return true;
}

/**
 * Filters the WBS tree keeping every ancestor of a matching task, so matches
 * stay visible in their hierarchy context.
 */
export function filterTaskTree(nodes: TaskTreeNode[], filters: TaskFilters): TaskTreeNode[] {
  if (!hasActiveFilters(filters)) return nodes;

  const visit = (node: TaskTreeNode): TaskTreeNode | null => {
    const children = node.children.map(visit).filter((c): c is TaskTreeNode => c !== null);
    if (children.length === 0 && !matchesFilters(node, filters)) return null;
    return { ...node, children };
  };

  return nodes.map(visit).filter((n): n is TaskTreeNode => n !== null);
}
