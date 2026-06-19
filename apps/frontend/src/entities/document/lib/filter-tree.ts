import type { DocumentTreeNode } from '@planforge/shared';

/**
 * Filters the docs tree by a case-insensitive title query, keeping any node
 * that matches or has a matching descendant (so the path stays navigable).
 */
export function filterDocumentTree(
  nodes: DocumentTreeNode[],
  query: string,
): DocumentTreeNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;

  const walk = (list: DocumentTreeNode[]): DocumentTreeNode[] =>
    list.reduce<DocumentTreeNode[]>((acc, node) => {
      const children = walk(node.children);
      if (node.title.toLowerCase().includes(q) || children.length > 0) {
        acc.push({ ...node, children });
      }
      return acc;
    }, []);

  return walk(nodes);
}
