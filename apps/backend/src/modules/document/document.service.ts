import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DocumentNodeType,
  Prisma,
  ProjectRole,
  type DocumentAccess,
  type DocumentNode,
} from '@prisma/client';
import type {
  CreateDocumentInput,
  DocumentBreadcrumb,
  DocumentDetail,
  DocumentMyAccess,
  DocumentNode as DocumentNodeDto,
  DocumentPermission,
  DocumentTreeNode,
  LinkDocumentInput,
  MoveDocumentInput,
  ProjectDocLink,
  ProjectDocNode,
  SetDocumentPermissionInput,
  UpdateDocumentInput,
} from '@planforge/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { MESSAGES } from '../../common/constants/messages';
import { MembershipService } from '../organization/membership.service';
import { ProjectAccessService } from '../project/project-access.service';
import {
  toDocumentDetailDto,
  toDocumentNodeDto,
  toDocumentTree,
} from './document.mapper';

/** Ordered capability ladder used for "at least this level" checks. */
const ACCESS_RANK: Record<DocumentMyAccess, number> = {
  VIEW: 1,
  COMMENT: 2,
  EDIT: 3,
  OWNER: 4,
};

/**
 * Docs are organization-scoped. A node is private to its creator unless shared
 * via `DocumentPermission` (the "private + shared" model). Reads require VIEW,
 * edits require EDIT; restructuring (move/delete) and sharing stay owner-only.
 */
@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  /** The caller's docs: their own tree plus nodes shared directly with them. */
  async getTree(userId: string): Promise<DocumentTreeNode[]> {
    const organizationId = await this.requireOrganizationId(userId);

    const owned = await this.prisma.documentNode.findMany({
      where: { organizationId, createdById: userId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    const shared = await this.prisma.documentPermission.findMany({
      where: { userId, node: { organizationId } },
      include: { node: true },
    });

    const access = new Map<string, DocumentMyAccess>();
    const nodes: DocumentNode[] = [];
    for (const node of owned) {
      access.set(node.id, 'OWNER');
      nodes.push(node);
    }
    for (const perm of shared) {
      if (access.has(perm.nodeId)) continue;
      access.set(perm.nodeId, perm.access);
      nodes.push(perm.node);
    }

    nodes.sort((a, b) => a.order - b.order || a.createdAt.getTime() - b.createdAt.getTime());
    return toDocumentTree(nodes, (id) => access.get(id) ?? 'VIEW');
  }

  async getById(userId: string, id: string): Promise<DocumentDetail> {
    const { node, access } = await this.requireNodeAccess(userId, id, 'VIEW');
    const breadcrumb = await this.buildBreadcrumb(userId, node);
    return toDocumentDetailDto(node, breadcrumb, access);
  }

  async create(userId: string, dto: CreateDocumentInput): Promise<DocumentNodeDto> {
    const organizationId = await this.requireOrganizationId(userId);

    const parentId = dto.parentId ?? null;
    if (parentId) {
      // The parent must exist, be ours, and be able to hold children.
      await this.requireParent(userId, organizationId, parentId);
    }

    const lastSibling = await this.prisma.documentNode.findFirst({
      where: { organizationId, createdById: userId, parentId },
      orderBy: { order: 'desc' },
    });

    const node = await this.prisma.documentNode.create({
      data: {
        type: dto.type as DocumentNodeType,
        title: dto.title,
        icon: dto.icon ?? null,
        parentId,
        organizationId,
        createdById: userId,
        order: (lastSibling?.order ?? -1) + 1,
      },
    });
    return toDocumentNodeDto(node, 'OWNER');
  }

  async update(userId: string, id: string, dto: UpdateDocumentInput): Promise<DocumentNodeDto> {
    const { node, access } = await this.requireNodeAccess(userId, id, 'EDIT');

    if (dto.content !== undefined && node.type === DocumentNodeType.FOLDER) {
      throw new BadRequestException(MESSAGES.DOCUMENT.CONTENT_ON_FOLDER);
    }

    const data: Prisma.DocumentNodeUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.icon !== undefined) data.icon = dto.icon;
    if (dto.coverColor !== undefined) data.coverColor = dto.coverColor;
    if (dto.content !== undefined) {
      data.content = (dto.content ?? Prisma.JsonNull) as Prisma.InputJsonValue;
    }

    const updated = await this.prisma.documentNode.update({ where: { id: node.id }, data });
    return toDocumentNodeDto(updated, access);
  }

  /** Reparent and reposition a node (drag & drop), shifting its new siblings. */
  async move(userId: string, id: string, dto: MoveDocumentInput): Promise<DocumentNodeDto> {
    const organizationId = await this.requireOrganizationId(userId);
    const node = await this.requireOwnedNode(userId, id);

    const parentId = dto.parentId ?? null;
    if (parentId) {
      if (parentId === node.id) {
        throw new BadRequestException(MESSAGES.DOCUMENT.CYCLIC_HIERARCHY);
      }
      await this.requireParent(userId, organizationId, parentId);
      await this.ensureNotDescendant(userId, node.id, parentId);
    }

    const siblings = await this.prisma.documentNode.findMany({
      where: { organizationId, createdById: userId, parentId, id: { not: node.id } },
      orderBy: { order: 'asc' },
    });

    const targetIndex = Math.min(dto.index ?? siblings.length, siblings.length);
    const ordered = [...siblings];
    ordered.splice(targetIndex, 0, { ...node, parentId });

    await this.prisma.$transaction(
      ordered.map((sibling, index) =>
        this.prisma.documentNode.update({
          where: { id: sibling.id },
          data: { order: index, ...(sibling.id === node.id ? { parentId } : {}) },
        }),
      ),
    );

    const moved = await this.prisma.documentNode.findUniqueOrThrow({ where: { id: node.id } });
    return toDocumentNodeDto(moved, 'OWNER');
  }

  async delete(userId: string, id: string): Promise<void> {
    const node = await this.requireOwnedNode(userId, id);
    // Children cascade via the self-referential FK (onDelete: Cascade).
    await this.prisma.documentNode.delete({ where: { id: node.id } });
  }

  // ─── Sharing (owner-only) ────────────────────────────────────────────────────

  async listPermissions(userId: string, id: string): Promise<DocumentPermission[]> {
    await this.requireOwnedNode(userId, id);
    return this.permissionsOf(id);
  }

  async setPermission(
    userId: string,
    id: string,
    dto: SetDocumentPermissionInput,
  ): Promise<DocumentPermission[]> {
    const node = await this.requireOwnedNode(userId, id);
    if (dto.userId === node.createdById) {
      throw new BadRequestException(MESSAGES.DOCUMENT.SHARE_WITH_OWNER);
    }
    const member = await this.membership.find(dto.userId, node.organizationId);
    if (!member) {
      throw new BadRequestException(MESSAGES.DOCUMENT.SHARE_TARGET_NOT_MEMBER);
    }

    await this.prisma.documentPermission.upsert({
      where: { nodeId_userId: { nodeId: id, userId: dto.userId } },
      create: { nodeId: id, userId: dto.userId, access: dto.access },
      update: { access: dto.access },
    });
    return this.permissionsOf(id);
  }

  async removePermission(
    userId: string,
    id: string,
    targetUserId: string,
  ): Promise<DocumentPermission[]> {
    await this.requireOwnedNode(userId, id);
    await this.prisma.documentPermission.deleteMany({ where: { nodeId: id, userId: targetUserId } });
    return this.permissionsOf(id);
  }

  // ─── Project links ───────────────────────────────────────────────────────────

  /**
   * Documents/folders linked to a project. A linked folder surfaces its whole
   * subtree. Linking is purely about visibility — `myAccess` is null for nodes
   * the caller can't open yet (they'd request access in a later phase).
   */
  async listProjectDocs(userId: string, projectId: string): Promise<ProjectDocLink[]> {
    await this.projectAccess.require(userId, projectId, ProjectRole.VIEWER);
    const organizationId = await this.requireOrganizationId(userId);

    const links = await this.prisma.documentProjectLink.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
    if (links.length === 0) return [];

    const nodes = await this.prisma.documentNode.findMany({ where: { organizationId } });
    const perms = await this.prisma.documentPermission.findMany({
      where: { userId, node: { organizationId } },
    });
    const permMap = new Map(perms.map((p) => [p.nodeId, p.access]));
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const childrenOf = new Map<string, DocumentNode[]>();
    for (const node of nodes) {
      if (!node.parentId) continue;
      const siblings = childrenOf.get(node.parentId) ?? [];
      siblings.push(node);
      childrenOf.set(node.parentId, siblings);
    }

    const accessOf = (node: DocumentNode): DocumentMyAccess | null =>
      node.createdById === userId ? 'OWNER' : (permMap.get(node.id) ?? null);

    const build = (node: DocumentNode): ProjectDocNode => ({
      id: node.id,
      type: node.type,
      title: node.title,
      icon: node.icon,
      parentId: node.parentId,
      createdById: node.createdById,
      myAccess: accessOf(node),
      children: (childrenOf.get(node.id) ?? [])
        .sort((a, b) => a.order - b.order || a.createdAt.getTime() - b.createdAt.getTime())
        .map(build),
    });

    return links
      .map((link) => {
        const node = byId.get(link.nodeId);
        return node ? { linkId: link.id, node: build(node) } : null;
      })
      .filter((link): link is ProjectDocLink => link !== null);
  }

  async linkToProject(
    userId: string,
    projectId: string,
    dto: LinkDocumentInput,
  ): Promise<ProjectDocLink[]> {
    await this.projectAccess.require(userId, projectId, ProjectRole.MEMBER);
    const organizationId = await this.requireOrganizationId(userId);

    const node = await this.prisma.documentNode.findFirst({
      where: { id: dto.nodeId, organizationId },
    });
    if (!node) {
      throw new NotFoundException(MESSAGES.DOCUMENT.NOT_FOUND);
    }
    // You must be able to see a node to attach it to a project.
    if (!(await this.accessFor(userId, node))) {
      throw new ForbiddenException(MESSAGES.DOCUMENT.FORBIDDEN);
    }

    await this.prisma.documentProjectLink.upsert({
      where: { nodeId_projectId: { nodeId: dto.nodeId, projectId } },
      create: { nodeId: dto.nodeId, projectId, createdById: userId },
      update: {},
    });
    return this.listProjectDocs(userId, projectId);
  }

  async unlinkFromProject(
    userId: string,
    projectId: string,
    linkId: string,
  ): Promise<ProjectDocLink[]> {
    await this.projectAccess.require(userId, projectId, ProjectRole.MEMBER);
    await this.prisma.documentProjectLink.deleteMany({ where: { id: linkId, projectId } });
    return this.listProjectDocs(userId, projectId);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async permissionsOf(nodeId: string): Promise<DocumentPermission[]> {
    const perms = await this.prisma.documentPermission.findMany({
      where: { nodeId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
    return perms.map((p) => ({
      access: p.access,
      user: {
        id: p.user.id,
        email: p.user.email,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
        avatarUrl: p.user.avatarUrl,
      },
    }));
  }

  private async requireOrganizationId(userId: string): Promise<string> {
    const membership = await this.membership.findCurrent(userId);
    if (!membership) {
      throw new NotFoundException(MESSAGES.ORGANIZATION.NOT_FOUND);
    }
    return membership.organizationId;
  }

  /** The caller's effective access to a node, or null if none. */
  private async accessFor(userId: string, node: DocumentNode): Promise<DocumentMyAccess | null> {
    if (node.createdById === userId) return 'OWNER';
    const perm = await this.prisma.documentPermission.findUnique({
      where: { nodeId_userId: { nodeId: node.id, userId } },
    });
    return perm ? perm.access : null;
  }

  /** Loads a node in the caller's org and asserts at least `min` access. */
  private async requireNodeAccess(
    userId: string,
    id: string,
    min: DocumentAccess,
  ): Promise<{ node: DocumentNode; access: DocumentMyAccess }> {
    const organizationId = await this.requireOrganizationId(userId);
    const node = await this.prisma.documentNode.findFirst({ where: { id, organizationId } });
    if (!node) {
      throw new NotFoundException(MESSAGES.DOCUMENT.NOT_FOUND);
    }
    const access = await this.accessFor(userId, node);
    if (!access || ACCESS_RANK[access] < ACCESS_RANK[min]) {
      throw new ForbiddenException(
        min === 'EDIT' ? MESSAGES.DOCUMENT.EDIT_FORBIDDEN : MESSAGES.DOCUMENT.FORBIDDEN,
      );
    }
    return { node, access };
  }

  /** Loads a node owned (created) by the caller, or throws 404. */
  private async requireOwnedNode(userId: string, id: string): Promise<DocumentNode> {
    const organizationId = await this.requireOrganizationId(userId);
    const node = await this.prisma.documentNode.findFirst({
      where: { id, organizationId, createdById: userId },
    });
    if (!node) {
      throw new NotFoundException(MESSAGES.DOCUMENT.NOT_FOUND);
    }
    return node;
  }

  private async requireParent(
    userId: string,
    organizationId: string,
    parentId: string,
  ): Promise<DocumentNode> {
    const parent = await this.prisma.documentNode.findFirst({
      where: { id: parentId, organizationId, createdById: userId },
    });
    if (!parent) {
      throw new BadRequestException(MESSAGES.DOCUMENT.PARENT_NOT_FOUND);
    }
    return parent;
  }

  /** Prevents moving a node into one of its own descendants (would orphan a cycle). */
  private async ensureNotDescendant(
    userId: string,
    nodeId: string,
    candidateParentId: string,
  ): Promise<void> {
    let cursor: string | null = candidateParentId;
    while (cursor) {
      if (cursor === nodeId) {
        throw new BadRequestException(MESSAGES.DOCUMENT.CYCLIC_HIERARCHY);
      }
      const parent: { parentId: string | null } | null =
        await this.prisma.documentNode.findFirst({
          where: { id: cursor, createdById: userId },
          select: { parentId: true },
        });
      cursor = parent?.parentId ?? null;
    }
  }

  /** Breadcrumb of the node and its accessible ancestors (stops at the first hidden one). */
  private async buildBreadcrumb(userId: string, node: DocumentNode): Promise<DocumentBreadcrumb[]> {
    const trail: DocumentBreadcrumb[] = [];
    let cursor: DocumentNode | null = node;
    while (cursor) {
      trail.unshift({ id: cursor.id, title: cursor.title, type: cursor.type });
      if (!cursor.parentId) break;
      const parent: DocumentNode | null = await this.prisma.documentNode.findUnique({
        where: { id: cursor.parentId },
      });
      if (!parent || !(await this.accessFor(userId, parent))) break;
      cursor = parent;
    }
    return trail;
  }
}
