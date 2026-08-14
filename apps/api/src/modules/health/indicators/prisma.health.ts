import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  type HealthIndicatorResult,
} from '@nestjs/terminus';

import { type PrismaService } from '../../../shared/prisma/prisma.service';
import { HEALTH_PRISMA_TIMEOUT_MS } from '../health.constants';

/**
 * Custom Terminus indicator for the Prisma client (Rule 15 of the
 * functional spec, ADR-17 §Custom indicators). Runs `SELECT 1` with a
 * 1-second timeout and reports up / down.
 *
 * The library ships a TypeORM indicator but not a Prisma one — we
 * implement our own per ADR-17.
 */
@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const result = await this.withTimeout(
        this.prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`,
        HEALTH_PRISMA_TIMEOUT_MS,
      );
      const isUp = Array.isArray(result) && result.length > 0;
      if (!isUp) {
        throw new Error('Prisma returned no rows for SELECT 1');
      }
      return this.getStatus(key, true);
    } catch (err) {
      throw new HealthCheckError(
        'Prisma check failed',
        this.getStatus(key, false, { message: (err as Error).message }),
      );
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Prisma health check timed out after ${ms}ms`)),
        ms,
      );
      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        },
      );
    });
  }
}
