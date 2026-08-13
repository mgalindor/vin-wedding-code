import { Controller, Get } from '@nestjs/common';

/**
 * Health-check stubs (per ADR-17).
 *
 * ARC-003 ships minimal stubs so the API can boot and respond to the ALB's
 * target-group health checks. ARC-036 (`Implement health checks (Terminus)`)
 * replaces these bodies with `@nestjs/terminus` indicators for Prisma + S3.
 *
 * - `GET /health/live`  — liveness: the Node.js process is running.
 * - `GET /health/ready` — readiness: stub returns OK. ARC-036 wires real
 *   Prisma + S3 reachability checks here.
 */
@Controller('health')
export class HealthController {
  @Get('live')
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  ready(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
