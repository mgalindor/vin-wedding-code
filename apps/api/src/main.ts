import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import 'reflect-metadata';
import { AppModule } from './app.module';
import { EnvConfig } from './config';

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

  // Forces EnvConfig.fromEnv() to run before listen — fails fast on bad env.
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