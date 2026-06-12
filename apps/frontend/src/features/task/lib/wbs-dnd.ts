import { arrayMove } from '@dnd-kit/sortable';

/** Flattened, render-ordered representation of a visible WBS row. */
export interface FlatTask {
  id: string;
  parentId: string | null;
  depth: number;
}

export interface DropProjection {
  parentId: string | null;
  /** Target position among the new parent's children. */
  index: number;
  depth: number;
}

/** Ids of every descendant of `taskId` within the flat (render-ordered) list. */
export function collectDescendantIds(items: FlatTask[], taskId: string): Set<string> {
  const result = new Set<string>();
  const start = items.findIndex((i) => i.id === taskId);
  if (start === -1) return result;

  const rootDepth = items[start]!.depth;
  for (let i = start + 1; i < items.length; i++) {
    if (items[i]!.depth <= rootDepth) break;
    result.add(items[i]!.id);
  }
  return result;
}

/**
 * Projects where the dragged row would land (dnd-kit sortable-tree pattern):
 * vertical position picks the slot, horizontal offset picks the depth,
 * clamped between the depth of the next row and previous-row depth + 1.
 */
export function getDropProjection(
  visibleItems: FlatTask[],
  activeId: string,
  overId: string,
  dragOffsetX: number,
  indentationWidth: number,
): DropProjection | null {
  // The dragged subtree cannot be its own drop target.
  const descendants = collectDescendantIds(visibleItems, activeId);
  if (descendants.has(overId)) return null;
  const items = visibleItems.filter((i) => !descendants.has(i.id));

  const activeIndex = items.findIndex((i) => i.id === activeId);
  const overIndex = items.findIndex((i) => i.id === overId);
  const activeItem = items[activeIndex];
  if (!activeItem || overIndex === -1) return null;

  const reordered = arrayMove(items, activeIndex, overIndex);
  const previousItem = reordered[overIndex - 1];
  const nextItem = reordered[overIndex + 1];

  const projectedDepth = activeItem.depth + Math.round(dragOffsetX / indentationWidth);
  const maxDepth = previousItem ? previousItem.depth + 1 : 0;
  const minDepth = nextItem ? nextItem.depth : 0;
  const depth = Math.min(Math.max(projectedDepth, minDepth), maxDepth);

  const parentId = (() => {
    if (depth === 0 || !previousItem) return null;
    if (depth === previousItem.depth) return previousItem.parentId;
    if (depth > previousItem.depth) return previousItem.id;
    // Depth decreased — find the closest preceding row at the target depth.
    const ancestor = reordered
      .slice(0, overIndex)
      .reverse()
      .find((i) => i.depth === depth);
    return ancestor?.parentId ?? null;
  })();

  // Position among the new siblings = how many of them precede the drop slot.
  const index = reordered
    .slice(0, overIndex)
    .filter((i) => i.parentId === parentId && i.id !== activeId).length;

  return { parentId, index, depth };
}
