import { Controller, Get } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

import { Public } from '../../shared/decorators/auth.decorators';

import {
  HEALTH_DISK_PATH,
  HEALTH_DISK_THRESHOLD_PERCENT,
  HEALTH_MEMORY_HEAP_LIMIT_BYTES,
  HEALTH_MEMORY_RSS_LIMIT_BYTES,
} from './health.constants';
import { PrismaHealthIndicator } from './indicators/prisma.health';

/**
 * Terminus-backed health endpoints (Rule 14–18 of the functional spec,
 * ADR-17). Both endpoints are unauthenticated — the ALB target group
 * probes /health/ready and the container HEALTHCHECK directive
 * probes /health/live. The @Public() decorator bypasses the global
 * JwtAuthGuard so they are reachable without a JWT.
 *
 * - /health/live  — process is up; cheap memory check only.
 * - /health/ready — Prisma reachable + memory + disk; ALB uses this
 *                   to drain unhealthy tasks.
 *
 * S3 readiness is deferred to ARC-030 (photo storage) which owns the
 * S3Config and the S3Client. Sprint 1 readiness probe does not check S3.
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly prisma: PrismaHealthIndicator,
  ) {}

  @Public()
  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([
      () =>
        this.memory.checkHeap(
          'memory_heap',
          HEALTH_MEMORY_HEAP_LIMIT_BYTES,
        ),
      () =>
        this.memory.checkRSS(
          'memory_rss',
          HEALTH_MEMORY_RSS_LIMIT_BYTES,
        ),
    ]);
  }

  @Public()
  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.prisma.isHealthy('database'),
      () =>
        this.memory.checkHeap(
          'memory_heap',
          HEALTH_MEMORY_HEAP_LIMIT_BYTES,
        ),
      () =>
        this.memory.checkRSS(
          'memory_rss',
          HEALTH_MEMORY_RSS_LIMIT_BYTES,
        ),
      () =>
        this.disk.checkStorage('disk', {
          thresholdPercent: HEALTH_DISK_THRESHOLD_PERCENT,
          path: HEALTH_DISK_PATH,
        }),
    ]);
  }
}
