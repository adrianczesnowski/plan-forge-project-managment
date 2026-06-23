import { arrayMove } from '@dnd-kit/sortable';
import type { DocumentTreeNode } from '@planforge/shared';

/** A tree node projected onto a flat, depth-annotated list for drag & drop. */
export interface FlatNode {
  id: string;
  node: DocumentTreeNode;
  parentId: string | null;
  depth: number;
}

/** Horizontal step (px) that nests/un-nests a row by one level while dragging. */
export const INDENT_WIDTH = 16;

/** Flattens the tree, descending only into expanded nodes (collapsed subtrees are hidden). */
export function flattenTree(
  nodes: DocumentTreeNode[],
  expanded: Set<string>,
  parentId: string | null = null,
  depth = 0,
): FlatNode[] {
  return nodes.flatMap((node) => {
    const self: FlatNode = { id: node.id, node, parentId, depth };
    const children =
      expanded.has(node.id) && node.children.length
        ? flattenTree(node.children, expanded, node.id, depth + 1)
        : [];
    return [self, ...children];
  });
}

/** Drops every descendant of the given ids (relies on parents preceding children). */
export function removeChildrenOf(items: FlatNode[], ids: string[]): FlatNode[] {
  const excluded = new Set(ids);
  return items.filter((item) => {
    if (item.parentId && excluded.has(item.parentId)) {
      excluded.add(item.id);
      return false;
    }
    return true;
  });
}

export interface Projection {
  depth: number;
  parentId: string | null;
}

/**
 * Computes the drop target (depth + parent) for the dragged row, given the
 * horizontal drag offset. Clamps to the depths allowed by the neighbouring
 * rows, mirroring the dnd-kit sortable-tree example.
 */
export function getProjection(
  items: FlatNode[],
  activeId: string,
  overId: string,
  dragOffsetX: number,
): Projection {
  const overIndex = items.findIndex((i) => i.id === overId);
  const activeIndex = items.findIndex((i) => i.id === activeId);
  if (overIndex === -1 || activeIndex === -1) return { depth: 0, parentId: null };

  const activeItem = items[activeIndex]!;
  const newItems = arrayMove(items, activeIndex, overIndex);
  const prev = newItems[overIndex - 1];
  const next = newItems[overIndex + 1];

  const projectedDepth = activeItem.depth + Math.round(dragOffsetX / INDENT_WIDTH);
  const maxDepth = prev ? prev.depth + 1 : 0;
  const minDepth = next ? next.depth : 0;
  const depth = Math.max(minDepth, Math.min(projectedDepth, maxDepth));

  const parentId = (() => {
    if (depth === 0 || !prev) return null;
    if (depth === prev.depth) return prev.parentId;
    if (depth > prev.depth) return prev.id;
    return (
      newItems
        .slice(0, overIndex)
        .reverse()
        .find((i) => i.depth === depth)?.parentId ?? null
    );
  })();

  return { depth, parentId };
}
