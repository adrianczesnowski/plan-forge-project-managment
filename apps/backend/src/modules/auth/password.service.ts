import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { ChangePasswordInput } from '@planforge/shared';
import { UserService } from '../user/user.service';
import { MESSAGES } from '../../common/constants/messages';

const SALT_ROUNDS = 12;

@Injectable()
export class PasswordService {
  constructor(private readonly userService: UserService) {}

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  async changePassword(userId: string, dto: ChangePasswordInput): Promise<void> {
    const user = await this.userService.findByIdOrThrow(userId);
    const valid = await this.verify(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestException(MESSAGES.USER.INVALID_CURRENT_PASSWORD);
    }
    await this.userService.updatePassword(userId, await this.hash(dto.newPassword));
  }
}
