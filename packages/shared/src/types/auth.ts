import type { User } from './user';

export interface AuthTokens {
  accessToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}
