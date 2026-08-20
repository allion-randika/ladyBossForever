import type { AdminRole } from '@prisma/client';

export type AuthPrincipalType = 'customer' | 'admin';

export interface JwtPayload {
  sub: string;
  email: string;
  type: AuthPrincipalType;
  role?: AdminRole;
}

export type AuthenticatedUser = JwtPayload;
