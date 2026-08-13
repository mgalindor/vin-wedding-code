import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

/**
 * Typed environment configuration (per ADR-16).
 *
 * Pattern:
 *   - `@Injectable()` so it can be requested as a constructor dependency.
 *   - `class-validator` decorators on every field.
 *   - `fromEnv()` factory reads `process.env`, transforms it into a typed
 *     instance, and validates. Missing or invalid values throw on boot with
 *     a clear, human-readable error message — never silently fallback.
 *
 * This class is the canonical example of ADR-16. New fields belong in
 * dedicated config classes (e.g. `DatabaseConfig`, `JwtConfig`, `S3Config`)
 * registered via the global `AppConfigModule`.
 */
@Injectable()
export class EnvConfig {
  @IsEnum(['development', 'staging', 'production', 'test'])
  NODE_ENV!: 'development' | 'staging' | 'production' | 'test';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT!: number;

  @IsString()
  LOG_LEVEL!: string;

  /**
   * Build an `EnvConfig` from `process.env`, validating required fields.
   * Throws on the first invalid value with a clear list of errors.
   */
  static fromEnv(env: NodeJS.ProcessEnv = process.env): EnvConfig {
    const candidate = plainToInstance(
      EnvConfig,
      {
        NODE_ENV: env.NODE_ENV,
        PORT: env.PORT !== undefined ? Number.parseInt(env.PORT, 10) : undefined,
        LOG_LEVEL: env.LOG_LEVEL,
      },
      { enableImplicitConversion: false },
    );
    const errors = validateSync(candidate, {
      skipMissingProperties: false,
      forbidUnknownValues: true,
    });
    if (errors.length > 0) {
      const messages = errors
        .map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
        .join('\n  ');
      throw new Error(`Invalid environment configuration:\n  ${messages}`);
    }
    return candidate;
  }
}
