import { Controller, Get, Param } from '@nestjs/common';
import { uuidSchema, type ProjectDashboard } from '@planforge/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { DashboardService } from './dashboard.service';

@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('projects/:projectId/dashboard')
  getProjectDashboard(
    @CurrentUser() user: AuthUser,
    @Param('projectId', new ZodValidationPipe(uuidSchema)) projectId: string,
  ): Promise<ProjectDashboard> {
    return this.dashboardService.getProjectDashboard(user.id, projectId);
  }
}
