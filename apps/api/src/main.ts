import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import 'reflect-metadata';
import { AppModule } from './app.module';
import { EnvConfig } from './config';

/**
 * Bootstrap (per ADR-14, ADR-16).
 *
 * - `ValidationPipe` is registered globally with `whitelist`, `forbidNonWhitelisted`,
 *   and `transform` so every request body is validated against DTOs from
 *   `@wendy/contracts` (ADR-14). The pipe is wired here so subsequent
 *   controllers can rely on it.
 * - `EnvConfig` is requested via DI to fail fast on missing/invalid env vars
 *   before any HTTP server starts. This is the canonical ADR-16 pattern.
 * - `unhandledRejection` and `uncaughtException` handlers log to stderr and
 *   exit with code 1 — the process supervisor should restart the container.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const env = app.get(EnvConfig);
  await app.listen(env.PORT);

   
  console.log(`Wendy Planner API listening on port ${env.PORT} (${env.NODE_ENV})`);
}

process.on('unhandledRejection', (reason) => {
   
  console.error('unhandledRejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
   
  console.error('uncaughtException:', err);
  process.exit(1);
});

void bootstrap();
