import { createPublicKey, KeyObject } from 'node:crypto';

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

import { JwtConfig } from '../../config/jwt.config';

// Branded user-id type (matches @wendy/contracts). The string is what
// `users.id` looks like in the database — a 10-char NanoId minted in app code.
export type UserId = string & { readonly __brand: 'UserId' };
export type TenantId = string & { readonly __brand: 'TenantId' };
export type Role = 'Administrator' | 'WeddingPlanner';

export interface AccessTokenClaims {
  sub: UserId;
  role: Role;
  tenantId: TenantId;
  iss?: string;
  aud?: string;
}

export interface JwksResponse {
  keys: Array<{
    kty: 'RSA';
    kid: string;
    use: 'sig';
    alg: 'RS256';
    n: string;
    e: string;
  }>;
}

/**
 * Single JWT issuance + verification entry point for the API (Rule 3 of
 * the functional spec, ADR-05 §Token mechanics, ADR-15 §Why RS256).
 *
 * The signing algorithm is RS256 and the private key never leaves the
 * process. The public key is derived once at boot and exposed at
 * /.well-known/jwks.json.
 *
 * Uses jsonwebtoken directly — same underlying library used by both
 * passport-jwt and @nestjs/jwt — to keep the dependency surface flat.
 */
@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name);
  private readonly publicKey: KeyObject;
  private readonly publicKeyPem: string;
  private readonly jwksResponse: JwksResponse;
  private readonly privateKey: jwt.Secret;

  constructor(private readonly config: JwtConfig) {
    // JwtConfig may be undefined in @nestjs/testing when @Global() providers
    // are not inherited correctly. Fall back to process.env so E2E tests work.
    const pem = config?.JWT_PRIVATE_KEY_PEM ?? process.env.JWT_PRIVATE_KEY_PEM ?? '';
    try {
      this.privateKey = pem;
      this.publicKey = createPublicKey(pem);
      this.publicKeyPem = this.publicKey.export({
        type: 'spki',
        format: 'pem',
      }) as string;
    } catch (err) {
      throw new Error(`Invalid JWT private key: ${(err as Error).message}`);
    }
    this.jwksResponse = this.buildJwks();
  }

  /**
   * Sign a 15-minute access token. The `jti` is a UUID v4 so the token
   * can be revoked later if we extend the layer with a revocation list
   * (currently none — see tech-spec.md §Technical Risks).
   */
  signAccessToken(claims: AccessTokenClaims): string {
    return jwt.sign(
      { sub: claims.sub, role: claims.role, tenantId: claims.tenantId },
      this.privateKey,
      {
        algorithm: 'RS256',
        issuer: (this.config?.JWT_ISSUER ?? process.env.JWT_ISSUER ?? "wendy-planner"),
        audience: (this.config?.JWT_AUDIENCE ?? process.env.JWT_AUDIENCE ?? "wendy"),
        keyid: (this.config?.JWT_KEY_ID ?? process.env.JWT_KEY_ID ?? ""),
        expiresIn: (this.config?.JWT_ACCESS_TOKEN_TTL_SECONDS ?? 900),
        jwtid: crypto.randomUUID(),
      },
    );
  }

  /**
   * Sign a 7-day refresh token. The contract (HttpOnly; Secure;
   * SameSite=Lax cookie) is documented in Rule 4 of the functional
   * spec; ARC-014 sets the cookie in /oauth/token.
   */
  signRefreshToken(claims: AccessTokenClaims): string {
    return jwt.sign(
      {
        sub: claims.sub,
        role: claims.role,
        tenantId: claims.tenantId,
        type: 'refresh',
      },
      this.privateKey,
      {
        algorithm: 'RS256',
        issuer: (this.config?.JWT_ISSUER ?? process.env.JWT_ISSUER ?? "wendy-planner"),
        audience: 'refresh',
        keyid: (this.config?.JWT_KEY_ID ?? process.env.JWT_KEY_ID ?? ""),
        expiresIn: (this.config?.JWT_REFRESH_TOKEN_TTL_SECONDS ?? 604800),
        jwtid: crypto.randomUUID(),
      },
    );
  }

  /**
   * Verify a Bearer access token. Throws UnauthorizedException on any
   * verification failure — passport-jwt calls this and surfaces the
   * error as a 401.
   */
  verifyAccessToken(token: string): AccessTokenClaims {
    try {
      const payload = jwt.verify(token, this.publicKeyPem, {
        algorithms: ['RS256'],
        issuer: (this.config?.JWT_ISSUER ?? process.env.JWT_ISSUER ?? "wendy-planner"),
        audience: (this.config?.JWT_AUDIENCE ?? process.env.JWT_AUDIENCE ?? "wendy"),
      }) as AccessTokenClaims;
      return {
        sub: payload.sub,
        role: payload.role,
        tenantId: payload.tenantId,
      };
    } catch (err) {
      this.logger.warn(
        `Access token verification failed: ${(err as Error).message}`,
      );
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Cached JWKS document for /.well-known/jwks.json. RFC 7517 shape;
   * only the algorithm we actually use (RS256) is advertised.
   */
  getJwks(): JwksResponse {
    return this.jwksResponse;
  }

  private buildJwks(): JwksResponse {
    const jwk = this.publicKey.export({ format: 'jwk' }) as {
      kty: string;
      n: string;
      e: string;
    };
    return {
      keys: [
        {
          kty: 'RSA',
          kid: (this.config?.JWT_KEY_ID ?? process.env.JWT_KEY_ID ?? ""),
          use: 'sig',
          alg: 'RS256',
          n: jwk.n ?? '',
          e: jwk.e ?? 'AQAB',
        },
      ],
    };
  }
}
