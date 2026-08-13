import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EnvConfig } from './env.config';

/**
 * Global typed-config module (per ADR-16).
 *
 * Wraps `@nestjs/config`'s `ConfigModule` and provides a single `EnvConfig`
 * instance to the whole application. The `EnvConfig.fromEnv()` factory is
 * called once on boot; if any required env var is missing or invalid, the
 * process crashes with a clear error message before any HTTP server starts.
 *
 * New typed config classes (e.g. DatabaseConfig, JwtConfig, S3Config) should
 * be added here as additional providers.
 */
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
  ],
  exports: [EnvConfig],
})
export class AppConfigModule {}
