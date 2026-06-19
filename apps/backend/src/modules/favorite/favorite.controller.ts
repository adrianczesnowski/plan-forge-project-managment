import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { addFavoriteSchema, type AddFavoriteInput, type FavoriteItem } from '@planforge/shared';
import { z } from 'zod';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { FavoriteService } from './favorite.service';

const entityTypeSchema = z.enum(['PROJECT', 'SPACE']);

@Controller('favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<FavoriteItem[]> {
    return this.favoriteService.list(user.id);
  }

  @Post()
  async add(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(addFavoriteSchema)) dto: AddFavoriteInput,
  ): Promise<{ added: boolean }> {
    await this.favoriteService.add(user.id, dto);
    return { added: true };
  }

  @Delete(':entityType/:entityId')
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('entityType', new ZodValidationPipe(entityTypeSchema)) entityType: string,
    @Param('entityId', new ZodValidationPipe(z.string().uuid())) entityId: string,
  ): Promise<{ removed: boolean }> {
    await this.favoriteService.remove(user.id, entityType, entityId);
    return { removed: true };
  }
}
