import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

// RS256 only — the algorithm is fixed by design, not env-driven.
// Defaults per tech-spec.md §Token Lifecycle:
//   - Access token:  1 hour (3600s)
//   - Refresh token: 3 days  (259200s)
// No revocation in MVP. See ADR-05.
@Injectable()
export class JwtConfig {
  @IsString()
  JWT_PRIVATE_KEY_PEM!: string;

  @IsString()
  @MinLength(1)
  JWT_KEY_ID!: string;

  @IsString()
  @MinLength(1)
  JWT_ISSUER!: string;

  @IsString()
  @MinLength(1)
  JWT_AUDIENCE!: string;

  // Access token: bounded [60s .. 24h]. Default 1h.
  @IsInt()
  @Min(60)
  @Max(86400)
  JWT_ACCESS_TOKEN_TTL_SECONDS!: number;

  // Refresh token: bounded [1h .. 7d]. Default 3d.
  @IsInt()
  @Min(3600)
  @Max(604800)
  JWT_REFRESH_TOKEN_TTL_SECONDS!: number;

  static fromEnv(env: NodeJS.ProcessEnv = process.env): JwtConfig {
    const candidate = plainToInstance(
      JwtConfig,
      {
        JWT_PRIVATE_KEY_PEM: env.JWT_PRIVATE_KEY_PEM,
        JWT_KEY_ID: env.JWT_KEY_ID,
        JWT_ISSUER: env.JWT_ISSUER ?? 'wendy-planner',
        JWT_AUDIENCE: env.JWT_AUDIENCE ?? 'wendy',
        JWT_ACCESS_TOKEN_TTL_SECONDS:
          env.JWT_ACCESS_TOKEN_TTL_SECONDS !== undefined
            ? Number.parseInt(env.JWT_ACCESS_TOKEN_TTL_SECONDS, 10)
            : 3600,
        JWT_REFRESH_TOKEN_TTL_SECONDS:
          env.JWT_REFRESH_TOKEN_TTL_SECONDS !== undefined
            ? Number.parseInt(env.JWT_REFRESH_TOKEN_TTL_SECONDS, 10)
            : 259200,
      },
      { enableImplicitConversion: false },
    );
    const errors = validateSync(candidate, {
      skipMissingProperties: false,
      forbidUnknownValues: true,
    });
    if (errors.length > 0) {
      const messages = errors
        .map(
          (e) =>
            `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`,
        )
        .join('\n');
      throw new Error(`[JwtConfig] validation failed:\n${messages}`);
    }
    return candidate;
  }
}
