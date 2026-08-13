import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { IsUrl, validateSync } from 'class-validator';

// Minimal typed DB config for Sprint 1 (ADR-16). ARC-006 will extend this
// with pool size and TLS options.
@Injectable()
export class DatabaseConfig {
  @IsUrl(
    {
      protocols: ['postgres', 'postgresql'],
      require_protocol: true,
      require_tld: false,
    },
    { message: 'DATABASE_URL must be a valid postgresql:// URL' },
  )
  DATABASE_URL!: string;

  static fromEnv(env: NodeJS.ProcessEnv = process.env): DatabaseConfig {
    const candidate = plainToInstance(
      DatabaseConfig,
      { DATABASE_URL: env.DATABASE_URL },
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
      throw new Error(`[DatabaseConfig] validation failed:\n${messages}`);
    }
    return candidate;
  }
}