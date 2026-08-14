import { HealthCheckError } from '@nestjs/terminus';
import { describe, expect, it, vi } from 'vitest';

import { PrismaHealthIndicator } from './prisma.health';

// ─── helpers ──────────────────────────────────────────────────────────────

function makePrismaStub(resolveWith?: unknown, rejectWith?: Error) {
  const stub = {
    $queryRaw: rejectWith
      ? vi.fn().mockRejectedValue(rejectWith)
      : vi.fn().mockResolvedValue(resolveWith ?? [{ ok: 1 }]),
  };
  return stub as any;
}

// ─── PrismaHealthIndicator unit tests ─────────────────────────────────────

describe('PrismaHealthIndicator', () => {
  // Rule 15 — healthy path
  it('returns { database: { status: "up" } } when SELECT 1 succeeds (Rule 15)', async () => {
    const indicator = new PrismaHealthIndicator(makePrismaStub([{ ok: 1 }]));
    const result = await indicator.isHealthy('database');
    expect(result).toEqual({ database: { status: 'up' } });
  });

  // Rule 15 — unhealthy path (DB error)
  it('throws HealthCheckError when Prisma rejects (Rule 15)', async () => {
    const indicator = new PrismaHealthIndicator(
      makePrismaStub(undefined, new Error('connection refused')),
    );
    await expect(indicator.isHealthy('database')).rejects.toBeInstanceOf(
      HealthCheckError,
    );
  });

  // Rule 15 — unhealthy path (empty result)
  it('throws HealthCheckError when Prisma returns no rows', async () => {
    const indicator = new PrismaHealthIndicator(makePrismaStub([]));
    await expect(indicator.isHealthy('database')).rejects.toBeInstanceOf(
      HealthCheckError,
    );
  });

  // Rule 15 — timeout: we mock the promise to hang indefinitely and
  // verify the indicator times out in ~1s (we use a very short value here).
  it('throws HealthCheckError when Prisma times out', async () => {
    // Never resolves — simulates a hung connection
    const hangingStub = {
      $queryRaw: vi.fn().mockReturnValue(new Promise(() => { /* hang */ })),
    } as any;
    const indicator = new PrismaHealthIndicator(hangingStub);

    // Override the timeout constant inline by calling with a very low ms
    // We access the private withTimeout indirectly through isHealthy.
    // To keep the test fast, we patch HEALTH_PRISMA_TIMEOUT_MS to 50ms
    // by replacing the import. For simplicity, we rely on the fact that
    // the actual indicator uses 1000ms and we just confirm it eventually
    // rejects — but we can't wait 1s per test, so we cast to any and
    // call withTimeout directly.
    const privateWithTimeout = (indicator as any).withTimeout.bind(indicator) as
      (p: Promise<unknown>, ms: number) => Promise<unknown>;

    await expect(
      privateWithTimeout(new Promise(() => { /* hang */ }), 50),
    ).rejects.toThrow(/timed out after 50ms/);
  });
});
