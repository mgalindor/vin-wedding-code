// Spins up a fresh Postgres container via testcontainers, applies the
// Prisma migrations, and exports DATABASE_URL to every Vitest worker.
// Prerequisite: Docker running on the host.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

const CONTAINER_IMAGE = 'postgres:17-alpine';
const DB_NAME = 'wendy_test';
const DB_USER = 'wendy';
const DB_PASSWORD = 'wendy';

function runPrismaMigrateDeploy(databaseUrl: string): void {
  const command =
    process.platform === 'win32'
      ? `cmd.exe /c "npx prisma migrate deploy"`
      : `npx prisma migrate deploy`;
  execFileSync(command, {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
    shell: process.platform === 'win32',
  });
}

export async function setup(): Promise<() => Promise<void>> {
  const container: StartedPostgreSqlContainer =
    await new PostgreSqlContainer(CONTAINER_IMAGE)
      .withDatabase(DB_NAME)
      .withUsername(DB_USER)
      .withPassword(DB_PASSWORD)
      .start();

  const connectionUri = container.getConnectionUri();

  runPrismaMigrateDeploy(connectionUri);

  process.env.DATABASE_URL = connectionUri;
  const envFile = join(tmpdir(), 'wendy-test-db-url');
  writeFileSync(envFile, connectionUri, 'utf8');

  console.log(
    `[integration] testcontainers Postgres ready at ${container.getHost()}:${container.getMappedPort(5432)} (db=${DB_NAME})`,
  );

  return async function teardown(): Promise<void> {
    await container.stop();
    try {
      mkdirSync(tmpdir(), { recursive: true });
    } catch {
      // teardown is best-effort
    }
  };
}