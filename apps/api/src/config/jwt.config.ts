import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsString,
  IsUUID,
  Max,
  Min,
  validateSync,
} from 'class-validator';

// Typed JWT config (ADR-16). One class per domain; validated at boot.
// Backed by Secrets Manager in prod (env var is injected by ECS task def).
// Per ADR-05 §Token mechanics and ADR-15 §Why RS256, the signing algorithm
// is RS256 and is NOT configurable via env vars at runtime.
@Injectable()
export class JwtConfig {
  @IsString()
  JWT_PRIVATE_KEY_PEM!: string;

  @IsUUID('4')
  JWT_KEY_ID!: string;

  @IsString()
  JWT_ISSUER!: string;

  @IsString()
  JWT_AUDIENCE!: string;

  @IsInt()
  @Min(60)
  @Max(3600)
  JWT_ACCESS_TOKEN_TTL_SECONDS!: number;

  @IsInt()
  @Min(3600)
  @Max(2592000)
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
            : 900,
        JWT_REFRESH_TOKEN_TTL_SECONDS:
          env.JWT_REFRESH_TOKEN_TTL_SECONDS !== undefined
            ? Number.parseInt(env.JWT_REFRESH_TOKEN_TTL_SECONDS, 10)
            : 604800,
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
