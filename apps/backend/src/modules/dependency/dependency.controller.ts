import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  createDependencySchema,
  uuidSchema,
  type CreateDependencyInput,
  type Dependency,
} from '@planforge/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { DependencyService } from './dependency.service';

const UuidParam = () => new ZodValidationPipe(uuidSchema);

@Controller()
export class DependencyController {
  constructor(private readonly dependencyService: DependencyService) {}

  @Post('dependencies')
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createDependencySchema)) dto: CreateDependencyInput,
  ): Promise<Dependency> {
    return this.dependencyService.create(user.id, dto);
  }

  @Get('projects/:projectId/dependencies')
  listByProject(
    @CurrentUser() user: AuthUser,
    @Param('projectId', UuidParam()) projectId: string,
  ): Promise<Dependency[]> {
    return this.dependencyService.listByProject(user.id, projectId);
  }

  @Get('tasks/:taskId/dependencies')
  listByTask(
    @CurrentUser() user: AuthUser,
    @Param('taskId', UuidParam()) taskId: string,
  ): Promise<Dependency[]> {
    return this.dependencyService.listByTask(user.id, taskId);
  }

  @Delete('dependencies/:id')
  async delete(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
  ): Promise<{ deleted: boolean }> {
    await this.dependencyService.delete(user.id, id);
    return { deleted: true };
  }
}
