/**
 * helpers/test-app.factory.ts
 *
 * Builds a NestJS test app over the REAL AppModule. Postgres via Prisma
 * points to the dev docker container; use cases / services stay as their
 * real DI providers. We then override the outbound adapter that the
 * particular adapter test wants to control (e.g. UserRepository).
 *
 * Per backend-blueprint §7.1 (Test File Layout & Naming):
 *   - This file lives in apps/api/test/integration/helpers/ - it is
 *     scaffolding for adapter tests, NOT a test itself.
 *   - The tests in this directory exercise only the inbound and outbound
 *     adapter boundaries (controller + HTTP on one side, repository + SQL
 *     on the other). Use cases and JWT internals stay in functional/.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../../../src/app.module';
import { JwtAuthGuard } from '../../../src/shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../src/shared/guards/roles.guard';
import { PrismaService } from '../../../src/shared/prisma/prisma.service';

export interface IntegrationTestContext {
  app: INestApplication;
  prisma: PrismaService;
  module: TestingModule;
}

/**
 * Compile AppModule with the same global pipes and guards as production.
 * Returns a ready-to-use INestApplication.
 */
export async function buildTestApp(): Promise<IntegrationTestContext> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Mirror the global guard wiring that main.ts performs at boot
  // (see ADR-15 and the comment in main.ts about APP_GUARD). Without
  // these, protected endpoints hit the controller with req.user
  // undefined and the @CurrentUser() decorator throws.
  //
  // `Test.createTestingModule(...)` does not auto-register NestJS's
  // internal Reflector provider the way `NestFactory.create()` does.
  // We instantiate it directly because Reflector is stateless — its
  // sole job is to read metadata set by our decorators.
  const reflector = new Reflector();
  app.useGlobalGuards(
    new JwtAuthGuard(reflector),
    new RolesGuard(reflector),
  );

  await app.init();

  return {
    app,
    prisma: moduleRef.get(PrismaService),
    module: moduleRef,
  };
}

/**
 * Truncate every public table. Preserves schema, migrations and enum types.
 * Called in beforeEach so each adapter test starts from a known state.
 */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;
  for (const { tablename } of tables) {
    if (tablename.startsWith('_')) continue; // skip Prisma internal tables
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE`,
    );
  }
}
