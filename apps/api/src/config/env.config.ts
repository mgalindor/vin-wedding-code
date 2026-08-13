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

// Typed env config (ADR-16). One class per domain; validated at boot.
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

  // Build from process.env and throw on the first invalid value.
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