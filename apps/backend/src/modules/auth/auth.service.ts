import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User as PrismaUser } from '@prisma/client';
import type { AuthResponse, LoginInput, RegisterInput, User } from '@planforge/shared';
import { MESSAGES } from '../../common/constants/messages';
import { UserService } from '../user/user.service';
import { toUserDto } from '../user/user.mapper';
import { PasswordService } from './password.service';
import { RefreshTokenService, type IssuedRefreshToken } from './refresh-token.service';
import type { JwtPayload } from './types/jwt-payload';

export interface AuthResult {
  response: AuthResponse;
  refreshToken: IssuedRefreshToken;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterInput): Promise<AuthResult> {
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(MESSAGES.AUTH.EMAIL_TAKEN);
    }

    const user = await this.userService.create({
      email: dto.email,
      passwordHash: await this.passwordService.hash(dto.password),
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    return this.buildAuthResult(user, false);
  }

  async login(dto: LoginInput): Promise<AuthResult> {
    const user = await this.userService.findByEmail(dto.email);
    if (!user || !(await this.passwordService.verify(dto.password, user.passwordHash))) {
      throw new UnauthorizedException(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }
    return this.buildAuthResult(user, dto.rememberMe);
  }

  /** Rotates the refresh token and issues a fresh access token. */
  async refresh(refreshToken: string): Promise<AuthResult> {
    const user = await this.refreshTokenService.consume(refreshToken);
    return this.buildAuthResult(user, false);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) {
      await this.refreshTokenService.revoke(refreshToken);
    }
  }

  async getMe(userId: string): Promise<User> {
    const user = await this.userService.findByIdOrThrow(userId);
    return toUserDto(user);
  }

  private async buildAuthResult(user: PrismaUser, rememberMe: boolean): Promise<AuthResult> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.refreshTokenService.issue(user.id, rememberMe),
    ]);

    return {
      response: { accessToken, user: toUserDto(user) },
      refreshToken,
    };
  }
}
