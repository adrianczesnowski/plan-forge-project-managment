import { Body, Controller, Patch } from '@nestjs/common';
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type UpdateProfileInput,
  type User,
} from '@planforge/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { UserService } from './user.service';
import { PasswordService } from '../auth/password.service';
import { toUserDto } from './user.mapper';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
  ) {}

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileInput,
  ): Promise<User> {
    const updated = await this.userService.updateProfile(user.id, dto);
    return toUserDto(updated);
  }

  @Patch('me/password')
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(changePasswordSchema)) dto: ChangePasswordInput,
  ): Promise<{ changed: boolean }> {
    await this.passwordService.changePassword(user.id, dto);
    return { changed: true };
  }
}
