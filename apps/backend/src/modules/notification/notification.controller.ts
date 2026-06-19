import { Controller, Get, Param, Patch } from '@nestjs/common';
import { uuidSchema, type Notification } from '@planforge/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<Notification[]> {
    return this.notificationService.list(user.id);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthUser): Promise<{ count: number }> {
    return { count: await this.notificationService.unreadCount(user.id) };
  }

  @Patch('read-all')
  async markAllRead(@CurrentUser() user: AuthUser): Promise<{ success: boolean }> {
    await this.notificationService.markAllRead(user.id);
    return { success: true };
  }

  @Patch(':id/read')
  async markRead(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(uuidSchema)) id: string,
  ): Promise<{ success: boolean }> {
    await this.notificationService.markRead(user.id, id);
    return { success: true };
  }
}
