import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRole, type Comment as PrismaComment, type User as PrismaUser } from '@prisma/client';
import type { Comment, CreateCommentInput, UpdateCommentInput } from '@planforge/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { MESSAGES } from '../../common/constants/messages';
import { ProjectAccessService } from '../project/project-access.service';
import { EventsGateway } from '../events/events.gateway';
import { NotificationService } from '../notification/notification.service';
import { toUserSummary } from '../user/user.mapper';

function toCommentDto(comment: PrismaComment & { author: PrismaUser }): Comment {
  return {
    id: comment.id,
    content: comment.content,
    taskId: comment.taskId,
    authorId: comment.authorId,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    author: toUserSummary(comment.author),
  };
}

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
    private readonly events: EventsGateway,
    private readonly notifications: NotificationService,
  ) {}

  /** Everyone with project access (including VIEWER) may comment. */
  async create(userId: string, taskId: string, dto: CreateCommentInput): Promise<Comment> {
    const task = await this.requireTaskAccess(userId, taskId);
    const comment = await this.prisma.comment.create({
      data: { content: dto.content, taskId, authorId: userId },
      include: { author: true },
    });
    this.events.emitToProject(task.projectId, 'comment:changed', { projectId: task.projectId, taskId });
    // Notify the task's assignee about a new comment from someone else.
    if (task.assigneeId && task.assigneeId !== userId) {
      await this.notifications.create({
        userId: task.assigneeId,
        type: 'COMMENT_MENTION',
        title: task.title,
        entityType: 'task',
        entityId: taskId,
      });
    }
    return toCommentDto(comment);
  }

  async listByTask(userId: string, taskId: string): Promise<Comment[]> {
    await this.requireTaskAccess(userId, taskId);
    const comments = await this.prisma.comment.findMany({
      where: { taskId },
      include: { author: true },
      orderBy: { createdAt: 'asc' },
    });
    return comments.map(toCommentDto);
  }

  async update(userId: string, commentId: string, dto: UpdateCommentInput): Promise<Comment> {
    await this.requireOwnComment(userId, commentId);
    const comment = await this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content },
      include: { author: true, task: { select: { projectId: true } } },
    });
    this.events.emitToProject(comment.task.projectId, 'comment:changed', {
      projectId: comment.task.projectId,
      taskId: comment.taskId,
    });
    return toCommentDto(comment);
  }

  async delete(userId: string, commentId: string): Promise<void> {
    const existing = await this.requireOwnComment(userId, commentId);
    const task = await this.prisma.task.findUnique({
      where: { id: existing.taskId },
      select: { projectId: true },
    });
    await this.prisma.comment.delete({ where: { id: commentId } });
    if (task) {
      this.events.emitToProject(task.projectId, 'comment:changed', {
        projectId: task.projectId,
        taskId: existing.taskId,
      });
    }
  }

  private async requireTaskAccess(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(MESSAGES.TASK.NOT_FOUND);
    }
    await this.access.require(userId, task.projectId, ProjectRole.VIEWER);
    return task;
  }

  private async requireOwnComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException(MESSAGES.COMMENT.NOT_FOUND);
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenException(MESSAGES.COMMENT.NOT_AUTHOR);
    }
    return comment;
  }
}
