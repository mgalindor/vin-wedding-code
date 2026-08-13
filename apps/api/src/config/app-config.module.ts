import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseConfig } from './database.config';
import { EnvConfig } from './env.config';

// Global typed-config (ADR-16). ConfigModule loads the .env file; the typed
// factories below read process.env and validate. App refuses to boot on
// missing or invalid env vars.
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
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