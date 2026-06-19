import { Injectable, Logger } from '@nestjs/common';
import type { Notification as PrismaNotification } from '@prisma/client';
import type { Notification, NotificationType } from '@planforge/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

interface CreateNotificationArgs {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}

function toDto(n: PrismaNotification): Notification {
  return {
    id: n.id,
    userId: n.userId,
    type: n.type as NotificationType,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    entityType: n.entityType,
    entityId: n.entityId,
    createdAt: n.createdAt.toISOString(),
  };
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
  ) {}

  /** Best-effort: a failed notification must never break the triggering action. */
  async create(args: CreateNotificationArgs): Promise<void> {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: args.userId,
          type: args.type,
          title: args.title,
          message: args.message ?? null,
          entityType: args.entityType ?? null,
          entityId: args.entityId ?? null,
        },
      });
      this.events.emitToUser(args.userId, 'notification:new', { id: notification.id });
    } catch (error) {
      this.logger.warn(`Failed to create notification: ${String(error)}`);
    }
  }

  async list(userId: string): Promise<Notification[]> {
    const items = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return items.map(toDto);
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markRead(userId: string, id: string): Promise<void> {
    await this.prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  }
}
