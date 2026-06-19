import type { DocumentNodeType } from './enums';

/** tiptap / ProseMirror document JSON — opaque to everything but the editor. */
export type DocumentContent = Record<string, unknown>;

/** A node in the docs tree: a folder (container) or a doc (tiptap page). */
export interface DocumentNode {
  id: string;
  type: DocumentNodeType;
  title: string;
  icon: string | null;
  coverColor: string | null;
  parentId: string | null;
  organizationId: string;
  createdById: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/** Tree node returned by the tree endpoint — children nested recursively. */
export interface DocumentTreeNode extends DocumentNode {
  children: DocumentTreeNode[];
}

/** One hop of a document's ancestry, oldest first (for the breadcrumb). */
export interface DocumentBreadcrumb {
  id: string;
  title: string;
  type: DocumentNodeType;
}

/** A single document with its body and ancestry — for the editor view. */
export interface DocumentDetail extends DocumentNode {
  content: DocumentContent | null;
  breadcrumb: DocumentBreadcrumb[];
}
