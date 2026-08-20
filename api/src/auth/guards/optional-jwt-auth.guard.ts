import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard, but never rejects the request for a missing/invalid
 * token — it just leaves `request.user` undefined. Used on routes that a
 * logged-in customer OR an unauthenticated guest (verified some other way,
 * e.g. a per-order guest token) may both call.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return user;
  }
}
