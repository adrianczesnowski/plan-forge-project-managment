import { Controller, Get, Param } from '@nestjs/common';
import { uuidSchema, type ActivityLog } from '@planforge/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ActivityService } from './activity.service';

const UuidParam = () => new ZodValidationPipe(uuidSchema);

@Controller()
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('tasks/:taskId/activity')
  listByTask(
    @CurrentUser() user: AuthUser,
    @Param('taskId', UuidParam()) taskId: string,
  ): Promise<ActivityLog[]> {
    return this.activityService.listByTask(user.id, taskId);
  }
}
