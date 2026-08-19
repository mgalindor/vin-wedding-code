import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../shared/prisma/prisma.service';

/**
 * Outbound adapter for the `weddings` table. US-009 ships only the
 * `create` operation; subsequent stories (US-010/011/012/013/022)
 * extend this class with read, update, archive, and publish
 * operations — same shape, same module, no cross-context imports.
 *
 * The repository is the only place that talks to the Prisma model;
 * the application layer never imports `@prisma/client` directly.
 */
@Injectable()
export class WeddingRepository {
  private readonly logger = new Logger(WeddingRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    id: string;
    tenantId: string;
    ownerUserId: string;
    createdByUserId: string;
    updatedByUserId: string;
    partner1Name: string;
    partner2Name: string;
    eventDate: Date;
    venueName: string;
    venueCity: string;
    status: 'draft' | 'published' | 'archived';
    createdAt: Date;
    updatedAt: Date;
  }) {
    return this.prisma.weddings.create({
      data: {
        id: input.id,
        tenant_id: input.tenantId,
        owner_user_id: input.ownerUserId,
        partner_1_name: input.partner1Name,
        partner_2_name: input.partner2Name,
        event_date: input.eventDate,
        venue_name: input.venueName,
        venue_city: input.venueCity,
        status: input.status,
        created_by_user_id: input.createdByUserId,
        updated_by_user_id: input.updatedByUserId,
      },
    });
  }
}