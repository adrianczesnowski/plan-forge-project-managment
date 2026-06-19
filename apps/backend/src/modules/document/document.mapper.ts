import type { DocumentNode as PrismaDocumentNode } from '@prisma/client';
import type {
  DocumentBreadcrumb,
  DocumentContent,
  DocumentDetail,
  DocumentNode,
  DocumentTreeNode,
} from '@planforge/shared';

export function toDocumentNodeDto(node: PrismaDocumentNode): DocumentNode {
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
  };
}

export function toDocumentDetailDto(
  node: PrismaDocumentNode,
  breadcrumb: DocumentBreadcrumb[],
): DocumentDetail {
  return {
    ...toDocumentNodeDto(node),
    content: (node.content as DocumentContent | null) ?? null,
    breadcrumb,
  };
}

/** Builds the nested tree from a flat, order-sorted node list. */
export function toDocumentTree(nodes: PrismaDocumentNode[]): DocumentTreeNode[] {
  const byId = new Map<string, DocumentTreeNode>();
  for (const node of nodes) {
    byId.set(node.id, { ...toDocumentNodeDto(node), children: [] });
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
