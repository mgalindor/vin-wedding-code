import { resolve } from 'node:path';

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseConfig } from './database.config';
import { EnvConfig } from './env.config';

// Global typed-config (ADR-16). ConfigModule loads env files; the typed
// factories below read process.env and validate. App refuses to boot on
// missing or invalid env vars.
//
// envFilePath resolution (OPS-023): NestJS resolves these relative to
// the API workspace root (apps/api/), so ../../.env.local points to the
// monorepo root. Local devs typically edit that one file; the
// apps/api/.env file remains as a fallback / override. First hit wins.
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [
        resolve(__dirname, '..', '..', '..', '..', '.env.local'),
        resolve(__dirname, '..', '..', '..', '..', '.env'),
        resolve(__dirname, '..', '..', '..', '.env.local'),
        resolve(__dirname, '..', '..', '..', '.env'),
      ],
    }),
  ],
  providers: [
    {
      provide: EnvConfig,
      useFactory: () => EnvConfig.fromEnv(),
    },
    {
      provide: DatabaseConfig,
      useFactory: () => DatabaseConfig.fromEnv(),
    },
  ],
  exports: [EnvConfig, DatabaseConfig],
})
export class AppConfigModule {}