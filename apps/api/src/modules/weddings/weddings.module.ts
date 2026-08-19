import { Module } from '@nestjs/common';

import { WeddingsService } from './application/weddings.service';
import { WeddingsController } from './inbound-adapters/weddings.controller';
import { WeddingRepository } from './outbound-adapters/wedding.repository';

/**
 * Wedding bounded context (ARC-019).
 *
 * US-009 ships the first surface: the create use case, the
 * `weddings` table repository, and the `POST /api/v1/weddings`
 * endpoint. Sibling contexts reach this module only through future
 * cross-context contracts added to a `public/` folder; for US-009
 * nothing in `identity` or any other context depends on this module
 * yet.
 */
@Module({
  controllers: [WeddingsController],
  providers: [WeddingsService, WeddingRepository],
})
export class WeddingsModule {}