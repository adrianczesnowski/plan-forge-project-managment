import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { addHiddenSchema, type AddHiddenInput, type HiddenItem } from '@planforge/shared';
import { z } from 'zod';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { HiddenService } from './hidden.service';

const entityTypeSchema = z.enum(['PROJECT', 'SPACE']);

@Controller('hidden')
export class HiddenController {
  constructor(private readonly hiddenService: HiddenService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<HiddenItem[]> {
    return this.hiddenService.list(user.id);
  }

  @Post()
  async add(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(addHiddenSchema)) dto: AddHiddenInput,
  ): Promise<{ hidden: boolean }> {
    await this.hiddenService.add(user.id, dto);
    return { hidden: true };
  }

  @Delete(':entityType/:entityId')
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('entityType', new ZodValidationPipe(entityTypeSchema)) entityType: string,
    @Param('entityId', new ZodValidationPipe(z.string().uuid())) entityId: string,
  ): Promise<{ removed: boolean }> {
    await this.hiddenService.remove(user.id, entityType, entityId);
    return { removed: true };
  }
}
