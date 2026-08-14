import { createPublicKey } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { type JwtConfig } from '../../../config/jwt.config';
import type { AuthenticatedUser } from '../../../shared/decorators/current-user.decorator';
import type { AccessTokenClaims } from '../../../shared/jwt/jwt.service';

// Derive the public key once at construction so passport-jwt can verify
// signatures against it. Same PEM as JwtService so both share one
// source of truth for the signing key.
function derivePublicKeyPem(privateKeyPem: string): string {
  return createPublicKey(privateKeyPem).export({
    type: 'spki',
    format: 'pem',
  }) as string;
}

/**
 * JWT strategy (Rule 8 of the functional spec, ADR-15). Extracts the
 * JWT from the Authorization: Bearer ... header, verifies it with the
 * public key derived from JWT_PRIVATE_KEY_PEM at boot, and populates
 * req.user with { id, role, tenantId } via validate().
 *
 * Registered with the name 'jwt' so JwtAuthGuard references it via
 * AuthGuard('jwt').
 *
 * Algorithm is pinned to RS256 (Rule 6 / ADR-15 §Why RS256) — forgetting
 * this restriction opens the door to algorithm-confusion attacks.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: JwtConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      audience: config.JWT_AUDIENCE,
      issuer: config.JWT_ISSUER,
      secretOrKey: derivePublicKeyPem(config.JWT_PRIVATE_KEY_PEM),
    });
  }

  /** Whatever this returns is set on req.user. */
  validate(payload: AccessTokenClaims): AuthenticatedUser {
    return {
      id: payload.sub,
      role: payload.role,
      tenantId: payload.tenantId,
    };
  }
}
