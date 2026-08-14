import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { type Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/auth.decorators';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';
import type { Role } from '../jwt/jwt.service';

/**
 * Role-based authorization guard (Rule 10 of the functional spec).
 * Reads the @Roles(...) metadata and compares it against
 * req.user.role, which is populated by JwtStrategy.validate() and is
 * always read from the JWT (never from the request body).
 *
 * Behavior:
 *   - If no @Roles(...) is set on the handler or class → allow.
 *   - If req.user.role is in the allowed list → allow.
 *   - Otherwise → 403 Forbidden with the platform's standard envelope.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) {
      // JwtAuthGuard should have populated req.user. If we got here
      // without it, something is misconfigured.
      throw new ForbiddenException('Insufficient role');
    }
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
