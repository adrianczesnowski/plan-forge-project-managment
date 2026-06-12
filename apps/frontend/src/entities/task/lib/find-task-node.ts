import type { TaskTreeNode } from '@planforge/shared';

export interface FoundTaskNode {
  node: TaskTreeNode;
  parent: TaskTreeNode | null;
}

/** DFS lookup of a task node (and its parent) within the WBS tree. */
export function findTaskNode(
  tree: TaskTreeNode[],
  taskId: string,
  parent: TaskTreeNode | null = null,
): FoundTaskNode | null {
  for (const node of tree) {
    if (node.id === taskId) return { node, parent };
    const found = findTaskNode(node.children, taskId, node);
    if (found) return found;
  }
  return null;
}
