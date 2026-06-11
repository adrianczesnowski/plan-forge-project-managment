import { Injectable, NotFoundException } from '@nestjs/common';
import type { User as PrismaUser } from '@prisma/client';
import type { UpdateProfileInput } from '@planforge/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { MESSAGES } from '../../common/constants/messages';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<PrismaUser | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async findByIdOrThrow(id: string): Promise<PrismaUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(MESSAGES.USER.NOT_FOUND);
    }
    return user;
  }

  create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
  }): Promise<PrismaUser> {
    return this.prisma.user.create({
      data: { ...data, email: data.email.toLowerCase() },
    });
  }

  updateProfile(id: string, data: UpdateProfileInput): Promise<PrismaUser> {
    return this.prisma.user.update({ where: { id }, data });
  }

  updatePassword(id: string, passwordHash: string): Promise<PrismaUser> {
    return this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }
}
