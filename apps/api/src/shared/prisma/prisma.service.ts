import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import type { DatabaseConfig } from '../../config/database.config';

// Singleton PrismaClient wrapper (ARC-008). Connect on init, disconnect on
// destroy. DATABASE_URL comes from typed config (ADR-16), not process.env.
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
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
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}