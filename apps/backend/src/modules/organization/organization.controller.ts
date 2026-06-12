import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  createOrganizationSchema,
  transferOwnershipSchema,
  updateOrganizationMemberSchema,
  updateOrganizationSchema,
  uuidSchema,
  type CreateOrganizationInput,
  type MyOrganization,
  type Organization,
  type OrganizationMember,
  type TransferOwnershipInput,
  type UpdateOrganizationInput,
  type UpdateOrganizationMemberInput,
} from '@planforge/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { OrganizationService } from './organization.service';

const UuidParam = () => new ZodValidationPipe(uuidSchema);

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createOrganizationSchema)) dto: CreateOrganizationInput,
  ): Promise<MyOrganization> {
    return this.organizationService.create(user.id, dto);
  }

  @Get('current')
  getCurrent(@CurrentUser() user: AuthUser): Promise<MyOrganization | null> {
    return this.organizationService.getCurrent(user.id);
  }

  @Get(':id')
  getById(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
  ): Promise<MyOrganization> {
    return this.organizationService.getById(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
    @Body(new ZodValidationPipe(updateOrganizationSchema)) dto: UpdateOrganizationInput,
  ): Promise<Organization> {
    return this.organizationService.update(user.id, id, dto);
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
  ): Promise<{ deleted: boolean }> {
    await this.organizationService.delete(user.id, id);
    return { deleted: true };
  }

  @Get(':id/members')
  listMembers(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
  ): Promise<OrganizationMember[]> {
    return this.organizationService.listMembers(user.id, id);
  }

  @Patch(':id/members/:userId')
  updateMemberRole(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
    @Param('userId', UuidParam()) targetUserId: string,
    @Body(new ZodValidationPipe(updateOrganizationMemberSchema))
    dto: UpdateOrganizationMemberInput,
  ): Promise<OrganizationMember> {
    return this.organizationService.updateMemberRole(user.id, id, targetUserId, dto);
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
    @Param('userId', UuidParam()) targetUserId: string,
  ): Promise<{ removed: boolean }> {
    await this.organizationService.removeMember(user.id, id, targetUserId);
    return { removed: true };
  }

  @Post(':id/leave')
  async leave(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
  ): Promise<{ left: boolean }> {
    await this.organizationService.leave(user.id, id);
    return { left: true };
  }

  @Post(':id/transfer-ownership')
  transferOwnership(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
    @Body(new ZodValidationPipe(transferOwnershipSchema)) dto: TransferOwnershipInput,
  ): Promise<Organization> {
    return this.organizationService.transferOwnership(user.id, id, dto);
  }
}
