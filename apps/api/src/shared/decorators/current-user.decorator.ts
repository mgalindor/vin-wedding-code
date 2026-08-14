import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { Role, TenantId, UserId } from '../jwt/jwt.service';

// Shape populated on req.user by JwtStrategy.validate(). Passport
// enforces these claims exist on the token — the type is the contract
// downstream handlers consume.
export interface AuthenticatedUser {
  id: UserId;
  role: Role;
  tenantId: TenantId;
}

/**
 * Parameter decorator that exposes the authenticated principal to
 * controller handlers as { id, role, tenantId }. See Rule 11 of the
 * functional spec.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    if (!request.user) {
      // The global JwtAuthGuard guarantees req.user is set by the time
      // we reach a handler. Throwing here is defensive — if a handler
      // is reached without auth, something has bypassed the guard.
      throw new Error(
        'CurrentUser: req.user is undefined (auth guard not applied?)',
      );
    }
    return request.user;
  },
);
