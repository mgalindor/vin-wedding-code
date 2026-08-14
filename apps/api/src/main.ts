import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NestFactory } from '@nestjs/core';

import 'reflect-metadata';
import { AppModule } from './app.module';
import { EnvConfig, JwtConfig } from './config';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { RolesGuard } from './shared/guards/roles.guard';

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

  // Register both auth guards globally (ARC-015, Rule 13 of the
  // functional spec). They honor the @Public() decorator so /health/*
  // and /.well-known/* are reachable without a JWT. We instantiate them
  // manually with Reflector here because APP_GUARD providers do not
  // consistently resolve Reflector in this codebase's setup.
  const reflector = app.get(Reflector);
  app.useGlobalGuards(
    new JwtAuthGuard(reflector),
    new RolesGuard(reflector),
  );

  // Forces the typed configs fromEnv() to run before listen — fails
  // fast on missing or invalid env. JwtConfig in particular requires
  // JWT_PRIVATE_KEY_PEM and JWT_KEY_ID at boot.
  app.get(EnvConfig);
  app.get(JwtConfig);
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
