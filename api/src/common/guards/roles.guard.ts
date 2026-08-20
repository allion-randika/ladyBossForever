import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AdminRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from '../../auth/auth.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user || user.type !== 'admin' || !user.role) {
      throw new ForbiddenException('Staff access required');
    }
    if (user.role === 'SUPER_ADMIN') return true;
    if (!required.includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }
    return true;
  }
}
