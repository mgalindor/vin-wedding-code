import {
  Injectable,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { type Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { IS_PUBLIC_KEY } from '../decorators/auth.decorators';

/**
 * Global authentication guard (Rule 9 of the functional spec, ADR-15).
 * Routes opt out with @Public().
 *
 * Wraps passport-jwt's `AuthGuard('jwt')` and reads the @Public()
 * metadata via Reflector. When the route is marked public, the guard
 * short-circuits to allow the request through without a JWT.
 *
 * Registered globally in main.ts. Forgetting to add the guard on a
 * new endpoint is impossible — it's on by default.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  override handleRequest<TUser>(
    err: unknown,
    user: TUser | false,
    info: unknown,
  ): TUser {
    if (err || !user) {
      const reason =
        (info as Error | undefined)?.message ??
        (err as Error | undefined)?.message ??
        'Missing or invalid token';
      throw new UnauthorizedException(reason);
    }
    return user;
  }
}
