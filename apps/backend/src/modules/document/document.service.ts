import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DocumentNodeType, Prisma, type DocumentNode } from '@prisma/client';
import type {
  CreateDocumentInput,
  DocumentBreadcrumb,
  DocumentDetail,
  DocumentNode as DocumentNodeDto,
  DocumentTreeNode,
  MoveDocumentInput,
  UpdateDocumentInput,
} from '@planforge/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { MESSAGES } from '../../common/constants/messages';
import { MembershipService } from '../organization/membership.service';
import {
  toDocumentDetailDto,
  toDocumentNodeDto,
  toDocumentTree,
} from './document.mapper';

/**
 * Docs are organization-scoped and private to their creator (the "private +
 * shared" model from the plan — sharing & project links land in a later phase).
 * Every read/write therefore scopes by both the current org and ownership.
 */
@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  /** The caller's whole docs tree within their current organization. */
  async getTree(userId: string): Promise<DocumentTreeNode[]> {
    const organizationId = await this.requireOrganizationId(userId);
    const nodes = await this.prisma.documentNode.findMany({
      where: { organizationId, createdById: userId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return toDocumentTree(nodes);
  }

  async getById(userId: string, id: string): Promise<DocumentDetail> {
    const node = await this.requireNode(userId, id);
    const breadcrumb = await this.buildBreadcrumb(node);
    return toDocumentDetailDto(node, breadcrumb);
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
    return toDocumentNodeDto(node);
  }

  async update(userId: string, id: string, dto: UpdateDocumentInput): Promise<DocumentNodeDto> {
    const node = await this.requireNode(userId, id);

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
    return toDocumentNodeDto(updated);
  }

  /** Reparent and reposition a node (drag & drop), shifting its new siblings. */
  async move(userId: string, id: string, dto: MoveDocumentInput): Promise<DocumentNodeDto> {
    const organizationId = await this.requireOrganizationId(userId);
    const node = await this.requireNode(userId, id);

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
    return toDocumentNodeDto(moved);
  }

  async delete(userId: string, id: string): Promise<void> {
    const node = await this.requireNode(userId, id);
    // Children cascade via the self-referential FK (onDelete: Cascade).
    await this.prisma.documentNode.delete({ where: { id: node.id } });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async requireOrganizationId(userId: string): Promise<string> {
    const membership = await this.membership.findCurrent(userId);
    if (!membership) {
      throw new NotFoundException(MESSAGES.ORGANIZATION.NOT_FOUND);
    }
    return membership.organizationId;
  }

  /** Loads a node owned by the caller in their org, or throws 404. */
  private async requireNode(userId: string, id: string): Promise<DocumentNode> {
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

  private async buildBreadcrumb(node: DocumentNode): Promise<DocumentBreadcrumb[]> {
    const trail: DocumentBreadcrumb[] = [];
    let cursor: DocumentNode | null = node;
    while (cursor) {
      trail.unshift({ id: cursor.id, title: cursor.title, type: cursor.type });
      cursor = cursor.parentId
        ? await this.prisma.documentNode.findUnique({ where: { id: cursor.parentId } })
        : null;
    }
    return trail;
  }
}
