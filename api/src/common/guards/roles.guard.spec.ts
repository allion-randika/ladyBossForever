import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import type { AuthenticatedUser } from '../../auth/auth.types';

function makeContext(user?: AuthenticatedUser): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  function guardWithRequiredRoles(roles: string[] | undefined) {
    const reflector = {
      getAllAndOverride: () => roles,
    } as unknown as Reflector;
    return new RolesGuard(reflector);
  }

  it('allows the request through when the route has no @Roles() metadata', () => {
    const guard = guardWithRequiredRoles(undefined);
    expect(guard.canActivate(makeContext(undefined))).toBe(true);
  });

  it('rejects an unauthenticated or non-admin principal', () => {
    const guard = guardWithRequiredRoles(['INVENTORY_MANAGER']);
    const customer: AuthenticatedUser = {
      sub: '1',
      email: 'c@x.com',
      type: 'customer',
    };
    expect(() => guard.canActivate(makeContext(customer))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects an admin whose role is not in the required list', () => {
    const guard = guardWithRequiredRoles(['INVENTORY_MANAGER']);
    const admin: AuthenticatedUser = {
      sub: '1',
      email: 'a@x.com',
      type: 'admin',
      role: 'ACCOUNTANT',
    };
    expect(() => guard.canActivate(makeContext(admin))).toThrow(
      ForbiddenException,
    );
  });

  it('allows an admin whose role matches the required list', () => {
    const guard = guardWithRequiredRoles(['INVENTORY_MANAGER']);
    const admin: AuthenticatedUser = {
      sub: '1',
      email: 'a@x.com',
      type: 'admin',
      role: 'INVENTORY_MANAGER',
    };
    expect(guard.canActivate(makeContext(admin))).toBe(true);
  });

  it('lets SUPER_ADMIN bypass any role requirement', () => {
    const guard = guardWithRequiredRoles(['ACCOUNTANT']);
    const superAdmin: AuthenticatedUser = {
      sub: '1',
      email: 'root@x.com',
      type: 'admin',
      role: 'SUPER_ADMIN',
    };
    expect(guard.canActivate(makeContext(superAdmin))).toBe(true);
  });
});
