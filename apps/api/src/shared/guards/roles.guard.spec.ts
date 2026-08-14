import { ForbiddenException } from '@nestjs/common';
import { type Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';

import { ROLES_KEY } from '../decorators/auth.decorators';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

import { RolesGuard } from './roles.guard';

// ─── helpers ──────────────────────────────────────────────────────────────

function makeContext(user: AuthenticatedUser | undefined, handlerRoles?: string[], classRoles?: string[]) {
  const getHandler = vi.fn();
  const getClass = vi.fn();
  const getRequest = vi.fn().mockReturnValue({ user });
  const switchToHttp = vi.fn().mockReturnValue({ getRequest });

  const reflector = {
    getAllAndOverride: vi.fn((key: string) => {
      if (key === ROLES_KEY) {
        return handlerRoles ?? classRoles ?? undefined;
      }
      return undefined;
    }),
  } as unknown as Reflector;

  const context = {
    getHandler,
    getClass,
    switchToHttp,
  } as any;

  return { context, reflector };
}

// ─── RolesGuard unit tests ─────────────────────────────────────────────────

describe('RolesGuard', () => {
  it('allows when no @Roles() metadata is set on the route', () => {
    const { context, reflector } = makeContext(
      { id: 'u1' as never, role: 'WeddingPlanner', tenantId: 't1' as never },
      undefined,
    );
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows when req.user.role IS in the @Roles() list', () => {
    const { context, reflector } = makeContext(
      { id: 'u1' as never, role: 'Administrator', tenantId: 't1' as never },
      ['Administrator', 'WeddingPlanner'],
    );
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(context)).toBe(true);
  });

  // Rule 10 + spec §UX Notes line 118
  it('throws ForbiddenException when req.user.role is NOT in @Roles() (Rule 10 — spec §UX Notes line 118)', () => {
    const { context, reflector } = makeContext(
      { id: 'u1' as never, role: 'WeddingPlanner', tenantId: 't1' as never },
      ['Administrator'], // only Administrator allowed
    );
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Insufficient role');
  });

  it('throws ForbiddenException when req.user is undefined (misconfiguration guard)', () => {
    const { context, reflector } = makeContext(
      undefined, // no user
      ['Administrator'],
    );
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('role check is read from JWT payload on req.user, never from req.body (Rule 10)', () => {
    // The guard reads req.user.role — we confirm it does NOT use req.body
    const getRequest = vi.fn().mockReturnValue({
      user: { id: 'u1', role: 'WeddingPlanner', tenantId: 't1' },
      body: { role: 'Administrator' }, // body tries to claim Admin — must be ignored
    });
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(['Administrator']),
    } as unknown as Reflector;
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({ getRequest }),
    } as any;
    const guard = new RolesGuard(reflector);
    // Should deny because req.user.role = 'WeddingPlanner', not 'Administrator'
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
