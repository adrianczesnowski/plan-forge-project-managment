import type { DocumentAccess, DocumentNodeType } from './enums';
import type { UserSummary } from './user';

/** tiptap / ProseMirror document JSON — opaque to everything but the editor. */
export type DocumentContent = Record<string, unknown>;

/** The caller's effective capability on a node: full control as owner, or a granted level. */
export type DocumentMyAccess = 'OWNER' | DocumentAccess;

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
  /** The current user's effective access to this node. */
  myAccess: DocumentMyAccess;
}

/** A user a node is shared with, and at what level. */
export interface DocumentPermission {
  user: UserSummary;
  access: DocumentAccess;
}

/** A node surfaced in a project's Docs tab. `myAccess` is null when the caller has no access yet. */
export interface ProjectDocNode {
  id: string;
  type: DocumentNodeType;
  title: string;
  icon: string | null;
  parentId: string | null;
  createdById: string;
  myAccess: DocumentMyAccess | null;
  children: ProjectDocNode[];
}

/** A document/folder linked to a project (the folder root carries its subtree). */
export interface ProjectDocLink {
  linkId: string;
  node: ProjectDocNode;
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
