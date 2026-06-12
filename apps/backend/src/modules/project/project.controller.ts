import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  addProjectMemberSchema,
  createProjectSchema,
  updateProjectMemberSchema,
  updateProjectSchema,
  uuidSchema,
  type AddProjectMemberInput,
  type CreateProjectInput,
  type Project,
  type ProjectMember,
  type ProjectWithRole,
  type UpdateProjectInput,
  type UpdateProjectMemberInput,
} from '@planforge/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ProjectService } from './project.service';

const UuidParam = () => new ZodValidationPipe(uuidSchema);

@Controller()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post('projects')
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createProjectSchema)) dto: CreateProjectInput,
  ): Promise<ProjectWithRole> {
    return this.projectService.create(user.id, dto);
  }

  @Get('spaces/:spaceId/projects')
  listBySpace(
    @CurrentUser() user: AuthUser,
    @Param('spaceId', UuidParam()) spaceId: string,
  ): Promise<ProjectWithRole[]> {
    return this.projectService.listBySpace(user.id, spaceId);
  }

  @Get('projects/:id')
  getById(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
  ): Promise<ProjectWithRole> {
    return this.projectService.getById(user.id, id);
  }

  @Patch('projects/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
    @Body(new ZodValidationPipe(updateProjectSchema)) dto: UpdateProjectInput,
  ): Promise<Project> {
    return this.projectService.update(user.id, id, dto);
  }

  @Delete('projects/:id')
  async delete(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
  ): Promise<{ deleted: boolean }> {
    await this.projectService.delete(user.id, id);
    return { deleted: true };
  }

  @Get('projects/:id/members')
  listMembers(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
  ): Promise<ProjectMember[]> {
    return this.projectService.listMembers(user.id, id);
  }

  @Post('projects/:id/members')
  addMember(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
    @Body(new ZodValidationPipe(addProjectMemberSchema)) dto: AddProjectMemberInput,
  ): Promise<ProjectMember> {
    return this.projectService.addMember(user.id, id, dto);
  }

  @Patch('projects/:id/members/:userId')
  updateMemberRole(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
    @Param('userId', UuidParam()) targetUserId: string,
    @Body(new ZodValidationPipe(updateProjectMemberSchema)) dto: UpdateProjectMemberInput,
  ): Promise<ProjectMember> {
    return this.projectService.updateMemberRole(user.id, id, targetUserId, dto.role);
  }

  @Delete('projects/:id/members/:userId')
  async removeMember(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
    @Param('userId', UuidParam()) targetUserId: string,
  ): Promise<{ removed: boolean }> {
    await this.projectService.removeMember(user.id, id, targetUserId);
    return { removed: true };
  }
}
