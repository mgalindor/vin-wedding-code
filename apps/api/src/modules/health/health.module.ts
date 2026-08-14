import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './indicators/prisma.health';

/**
 * Health module (ADR-17). ARC-003 shipped a stub controller; ARC-036
 * replaces it with @nestjs/terminus wired to:
 *   - MemoryHealthIndicator (built-in)
 *   - DiskHealthIndicator   (built-in)
 *   - PrismaHealthIndicator (custom — see ./indicators/prisma.health.ts)
 *
 * S3HealthIndicator is deferred to ARC-030 (photo storage), which
 * owns the S3Config and the S3Client.
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator],
})
export class HealthModule {}
