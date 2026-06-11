import { createHash, randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RefreshToken, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MESSAGES } from '../../common/constants/messages';
import { parseDurationMs } from '../../common/utils/duration';
import type { Env } from '../../config/env.validation';

export interface IssuedRefreshToken {
  token: string;
  expiresAt: Date;
}

/**
 * Refresh tokens are opaque random strings. Only a SHA-256 hash is persisted,
 * so a database leak does not expose usable tokens. Tokens are rotated on every refresh.
 */
@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async issue(userId: string, rememberMe: boolean): Promise<IssuedRefreshToken> {
    const token = randomBytes(48).toString('hex');
    const ttlKey = rememberMe ? 'JWT_REFRESH_REMEMBER_ME_EXPIRES_IN' : 'JWT_REFRESH_EXPIRES_IN';
    const ttlMs = parseDurationMs(this.config.get(ttlKey, { infer: true }));
    const expiresAt = new Date(Date.now() + ttlMs);

    await this.prisma.refreshToken.create({
      data: { tokenHash: this.hash(token), userId, expiresAt },
    });

    return { token, expiresAt };
  }

  /** Validates the token, deletes it (rotation) and returns its owner. */
  async consume(token: string): Promise<User> {
    const stored = await this.findValid(token);
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return stored.user;
  }

  async revoke(token: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash: this.hash(token) } });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  private async findValid(token: string): Promise<RefreshToken & { user: User }> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(token) },
      include: { user: true },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException(MESSAGES.AUTH.REFRESH_TOKEN_INVALID);
    }
    return stored;
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
