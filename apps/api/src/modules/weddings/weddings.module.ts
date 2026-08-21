import { Module } from '@nestjs/common';

import { WEDDING_REPOSITORY_PORT } from './application/wedding-list.repository.port';
import { WeddingsService } from './application/weddings.service';
import { WeddingsController } from './inbound-adapters/weddings.controller';
import { WeddingRepository } from './outbound-adapters/wedding.repository';

/**
 * Wedding bounded context (ARC-019).
 *
 * The application depends on `WeddingListRepositoryPort`; the
 * concrete `WeddingRepository` adapter satisfies that port via a
 * `useExisting` binding. Swapping Prisma for, say, a Postgres-only
 * test double touches only the adapter — the service stays blind to
 * the substitution.
 */
@Module({
  controllers: [WeddingsController],
  providers: [
    WeddingsService,
    WeddingRepository,
    {
      provide: WEDDING_REPOSITORY_PORT,
      useExisting: WeddingRepository,
    },
  ],
})
export class WeddingsModule {}
