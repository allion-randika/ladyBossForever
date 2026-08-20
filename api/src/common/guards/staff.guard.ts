import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/auth.types';

/**
 * For routes any staff member may access regardless of role (e.g. the
 * dashboard). RolesGuard with no @Roles() on a route lets *any*
 * authenticated principal through, including a customer — that's correct
 * for "no restriction," but wrong for "staff only, any role," which this
 * covers instead.
 */
@Injectable()
export class StaffGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    if (!request.user || request.user.type !== 'admin') {
      throw new ForbiddenException('Staff access required');
    }
    return true;
  }
}
