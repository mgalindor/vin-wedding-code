import { SetMetadata } from '@nestjs/common';

import { Role } from '../jwt/jwt.service';

// Decorator keys read by JwtAuthGuard and RolesGuard. Kept as constants
// so a typo doesn't silently disable the guard.
export const IS_PUBLIC_KEY = 'wendy:auth:isPublic';
export const ROLES_KEY = 'wendy:auth:roles';

/**
 * Marks a route handler or controller as not requiring authentication.
 * The global JwtAuthGuard honors this metadata (Rule 12 of the
 * functional spec). Use this for /health/* and /.well-known/*.
 */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Declares which roles are allowed to call a handler. Roles are read
 * from the JWT (never from the request body — Rule 10 of the
 * functional spec). Mismatch returns 403.
 */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
