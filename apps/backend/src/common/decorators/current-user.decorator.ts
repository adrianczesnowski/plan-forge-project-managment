import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

/** User attached to the request by JwtStrategy. */
export interface AuthUser {
  id: string;
  email: string;
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const request = ctx.switchToHttp().getRequest<Request & { user: AuthUser }>();
  return request.user;
});
