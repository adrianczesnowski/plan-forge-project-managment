import type { Dependency, TaskTreeNode } from '@planforge/shared';

const DAY_MS = 24 * 60 * 60 * 1000;

function durationDays(task: TaskTreeNode): number {
  if (!task.startDate || !task.endDate) return 1;
  const diff = Math.round(
    (new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / DAY_MS,
  );
  return Math.max(1, diff + 1);
}

/**
 * Classic CPM forward pass approximated on the dependency graph (all link
 * types treated as finish-to-start + lag). Returns ids of tasks lying on the
 * longest path — the chain that determines the project end date.
 */
export function computeCriticalPath(
  tasks: TaskTreeNode[],
  dependencies: Dependency[],
): Set<string> {
  const taskIds = new Set(tasks.map((t) => t.id));
  const edges = dependencies.filter(
    (d) => taskIds.has(d.predecessorId) && taskIds.has(d.successorId),
  );
  if (edges.length === 0) return new Set();

  const successors = new Map<string, Dependency[]>();
  const predecessors = new Map<string, Dependency[]>();
  const inDegree = new Map<string, number>(tasks.map((t) => [t.id, 0]));
  for (const edge of edges) {
    successors.set(edge.predecessorId, [
      ...(successors.get(edge.predecessorId) ?? []),
      edge,
    ]);
    predecessors.set(edge.successorId, [...(predecessors.get(edge.successorId) ?? []), edge]);
    inDegree.set(edge.successorId, (inDegree.get(edge.successorId) ?? 0) + 1);
  }

  const duration = new Map(tasks.map((t) => [t.id, durationDays(t)]));
  const earliestStart = new Map<string, number>(tasks.map((t) => [t.id, 0]));
  const earliestFinish = new Map<string, number>();

  // Kahn topological order; the backend rejects cycles, so this visits all.
  const queue = tasks.filter((t) => (inDegree.get(t.id) ?? 0) === 0).map((t) => t.id);
  const order: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    earliestFinish.set(id, (earliestStart.get(id) ?? 0) + (duration.get(id) ?? 1));
    for (const edge of successors.get(id) ?? []) {
      const candidate = (earliestFinish.get(id) ?? 0) + edge.lag;
      if (candidate > (earliestStart.get(edge.successorId) ?? 0)) {
        earliestStart.set(edge.successorId, candidate);
      }
      const remaining = (inDegree.get(edge.successorId) ?? 1) - 1;
      inDegree.set(edge.successorId, remaining);
      if (remaining === 0) queue.push(edge.successorId);
    }
  }

  // Only tasks connected to the dependency graph compete for the critical path.
  const connected = new Set(edges.flatMap((e) => [e.predecessorId, e.successorId]));
  let endId: string | null = null;
  let maxFinish = -1;
  for (const id of connected) {
    const finish = earliestFinish.get(id) ?? 0;
    if (finish > maxFinish) {
      maxFinish = finish;
      endId = id;
    }
  }
  if (!endId) return new Set();

  // Walk back through predecessors that bind the schedule (zero slack).
  const critical = new Set<string>();
  let current: string | null = endId;
  while (current) {
    critical.add(current);
    const start: number = earliestStart.get(current) ?? 0;
    const binding: Dependency | undefined = (predecessors.get(current) ?? []).find(
      (edge): boolean => (earliestFinish.get(edge.predecessorId) ?? 0) + edge.lag === start,
    );
    current = binding ? binding.predecessorId : null;
  }
  return critical;
}
