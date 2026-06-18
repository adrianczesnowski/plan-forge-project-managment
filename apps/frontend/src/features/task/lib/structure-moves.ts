import type { TaskTreeNode } from '@planforge/shared';

export interface MoveTarget {
  parentId: string | null;
  order: number;
}

/** Structural moves available for a task from the WBS "move" menu. */
export interface StructureMoves {
  /** Become the last child of the previous sibling (deeper). */
  indent: MoveTarget | null;
  /** Move to the parent's level, right after the parent (shallower). */
  outdent: MoveTarget | null;
  moveUp: MoveTarget | null;
  moveDown: MoveTarget | null;
}

interface NodeContext {
  parent: TaskTreeNode | null;
  grandparentId: string | null;
  siblings: TaskTreeNode[];
  index: number;
}

function findContext(
  nodes: TaskTreeNode[],
  taskId: string,
  parent: TaskTreeNode | null = null,
  grandparentId: string | null = null,
): NodeContext | null {
  const index = nodes.findIndex((n) => n.id === taskId);
  if (index !== -1) {
    return { parent, grandparentId, siblings: nodes, index };
  }
  for (const node of nodes) {
    const found = findContext(node.children, taskId, node, parent?.id ?? null);
    if (found) return found;
  }
  return null;
}

export function getStructureMoves(tree: TaskTreeNode[], taskId: string): StructureMoves {
  const context = findContext(tree, taskId);
  if (!context) {
    return { indent: null, outdent: null, moveUp: null, moveDown: null };
  }
  const { parent, grandparentId, siblings, index } = context;
  const previousSibling = index > 0 ? siblings[index - 1] : undefined;

  return {
    indent: previousSibling
      ? { parentId: previousSibling.id, order: previousSibling.children.length }
      : null,
    outdent: parent
      ? { parentId: grandparentId, order: findContext(tree, parent.id)!.index + 1 }
      : null,
    moveUp: index > 0 ? { parentId: parent?.id ?? null, order: index - 1 } : null,
    moveDown:
      index < siblings.length - 1 ? { parentId: parent?.id ?? null, order: index + 1 } : null,
  };
}
