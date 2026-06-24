import type { DocumentNode as PrismaDocumentNode } from '@prisma/client';
import type {
  DocumentBreadcrumb,
  DocumentContent,
  DocumentDetail,
  DocumentMyAccess,
  DocumentNode,
  DocumentTreeNode,
} from '@planforge/shared';

export function toDocumentNodeDto(
  node: PrismaDocumentNode,
  myAccess: DocumentMyAccess,
): DocumentNode {
  return {
    id: node.id,
    type: node.type,
    title: node.title,
    icon: node.icon,
    coverColor: node.coverColor,
    parentId: node.parentId,
    organizationId: node.organizationId,
    createdById: node.createdById,
    order: node.order,
    createdAt: node.createdAt.toISOString(),
    updatedAt: node.updatedAt.toISOString(),
    myAccess,
  };
}

export function toDocumentDetailDto(
  node: PrismaDocumentNode,
  breadcrumb: DocumentBreadcrumb[],
  myAccess: DocumentMyAccess,
): DocumentDetail {
  return {
    ...toDocumentNodeDto(node, myAccess),
    content: (node.content as DocumentContent | null) ?? null,
    breadcrumb,
  };
}

/**
 * Builds the nested tree from a flat, order-sorted node list. `accessOf` yields
 * each node's effective access; nodes whose parent is absent from the list
 * (e.g. a doc shared to me but nested in someone else's folder) surface as roots.
 */
export function toDocumentTree(
  nodes: PrismaDocumentNode[],
  accessOf: (nodeId: string) => DocumentMyAccess,
): DocumentTreeNode[] {
  const byId = new Map<string, DocumentTreeNode>();
  for (const node of nodes) {
    byId.set(node.id, { ...toDocumentNodeDto(node, accessOf(node.id)), children: [] });
  }

  const roots: DocumentTreeNode[] = [];
  for (const node of nodes) {
    const treeNode = byId.get(node.id)!;
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) {
      parent.children.push(treeNode);
    } else {
      roots.push(treeNode);
    }
  }
  return roots;
}
