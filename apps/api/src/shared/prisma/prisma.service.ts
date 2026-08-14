import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { DatabaseConfig } from '../../config/database.config';

// Singleton PrismaClient wrapper (ARC-008). Connect on init, disconnect on
// destroy. DATABASE_URL comes from typed config (ADR-16), not process.env.
//
// The $connect() call is intentionally non-fatal: if Postgres is unreachable
// at boot (e.g. docker-compose not running in local dev), the API process
// keeps running and /health/ready will return 503 (database: down) while
// /.well-known/jwks.json and /health/live remain available. In production
// the ALB will not route traffic until /health/ready returns 200.
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(dbConfig: DatabaseConfig) {
    super({
      datasources: {
        db: {
          url: dbConfig.DATABASE_URL,
        },
      },
      log: ['error', 'warn'],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
    } catch (err) {
      this.logger.warn(
        `Database connection failed at boot — /health/ready will report unhealthy: ${(err as Error).message}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
