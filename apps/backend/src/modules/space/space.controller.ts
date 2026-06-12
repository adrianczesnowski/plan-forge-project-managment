import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  addSpaceMemberSchema,
  createSpaceSchema,
  reorderSpacesSchema,
  updateSpaceMemberSchema,
  updateSpaceSchema,
  uuidSchema,
  type AddSpaceMemberInput,
  type CreateSpaceInput,
  type ReorderSpacesInput,
  type Space,
  type SpaceMember,
  type SpaceWithRole,
  type UpdateSpaceInput,
  type UpdateSpaceMemberInput,
} from '@planforge/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SpaceService } from './space.service';

const UuidParam = () => new ZodValidationPipe(uuidSchema);

@Controller('spaces')
export class SpaceController {
  constructor(private readonly spaceService: SpaceService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createSpaceSchema)) dto: CreateSpaceInput,
  ): Promise<SpaceWithRole> {
    return this.spaceService.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<SpaceWithRole[]> {
    return this.spaceService.list(user.id);
  }

  // Must be declared before ':id' so "reorder" is not parsed as a space id.
  @Patch('reorder')
  async reorder(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(reorderSpacesSchema)) dto: ReorderSpacesInput,
  ): Promise<{ reordered: boolean }> {
    await this.spaceService.reorder(user.id, dto);
    return { reordered: true };
  }

  @Get(':id')
  getById(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
  ): Promise<SpaceWithRole> {
    return this.spaceService.getById(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
    @Body(new ZodValidationPipe(updateSpaceSchema)) dto: UpdateSpaceInput,
  ): Promise<Space> {
    return this.spaceService.update(user.id, id, dto);
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
  ): Promise<{ deleted: boolean }> {
    await this.spaceService.delete(user.id, id);
    return { deleted: true };
  }

  @Get(':id/members')
  listMembers(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
  ): Promise<SpaceMember[]> {
    return this.spaceService.listMembers(user.id, id);
  }

  @Post(':id/members')
  addMember(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
    @Body(new ZodValidationPipe(addSpaceMemberSchema)) dto: AddSpaceMemberInput,
  ): Promise<SpaceMember> {
    return this.spaceService.addMember(user.id, id, dto);
  }

  @Patch(':id/members/:userId')
  updateMemberRole(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
    @Param('userId', UuidParam()) targetUserId: string,
    @Body(new ZodValidationPipe(updateSpaceMemberSchema)) dto: UpdateSpaceMemberInput,
  ): Promise<SpaceMember> {
    return this.spaceService.updateMemberRole(user.id, id, targetUserId, dto.role);
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
    @Param('userId', UuidParam()) targetUserId: string,
  ): Promise<{ removed: boolean }> {
    await this.spaceService.removeMember(user.id, id, targetUserId);
    return { removed: true };
  }
}
