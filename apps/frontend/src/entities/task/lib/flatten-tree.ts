import type { TaskTreeNode } from '@planforge/shared';

/** Depth-first flattening of the WBS tree (render order preserved). */
export function flattenTree(nodes: TaskTreeNode[]): TaskTreeNode[] {
  const result: TaskTreeNode[] = [];
  const visit = (node: TaskTreeNode) => {
    result.push(node);
    node.children.forEach(visit);
  };
  nodes.forEach(visit);
  return result;
}
