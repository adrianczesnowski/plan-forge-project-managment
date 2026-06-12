import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  createInvitationSchema,
  uuidSchema,
  type CreateInvitationInput,
  type InvitationWithInviter,
  type MyOrganization,
  type PendingInvitation,
} from '@planforge/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { InvitationService } from './invitation.service';

const UuidParam = () => new ZodValidationPipe(uuidSchema);

@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createInvitationSchema)) dto: CreateInvitationInput,
  ): Promise<InvitationWithInviter> {
    return this.invitationService.create(user, dto);
  }

  @Get()
  listForOrganization(@CurrentUser() user: AuthUser): Promise<InvitationWithInviter[]> {
    return this.invitationService.listForOrganization(user.id);
  }

  @Get('pending')
  listPending(@CurrentUser() user: AuthUser): Promise<PendingInvitation[]> {
    return this.invitationService.listPendingForUser(user.email);
  }

  @Post(':id/accept')
  accept(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
  ): Promise<MyOrganization> {
    return this.invitationService.accept(user, id);
  }

  @Post(':id/reject')
  async reject(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
  ): Promise<{ rejected: boolean }> {
    await this.invitationService.reject(user, id);
    return { rejected: true };
  }

  @Delete(':id')
  async cancel(
    @CurrentUser() user: AuthUser,
    @Param('id', UuidParam()) id: string,
  ): Promise<{ cancelled: boolean }> {
    await this.invitationService.cancel(user.id, id);
    return { cancelled: true };
  }
}
