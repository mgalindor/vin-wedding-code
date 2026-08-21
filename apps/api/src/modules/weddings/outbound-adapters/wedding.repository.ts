import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { type WeddingDto } from '@wendy/contracts';

import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  type ListArgs,
  type NewWedding,
  type StatusFilter,
  type WeddingListFilter,
  type WeddingListOrderBy,
  type WeddingListRepositoryPort,
} from '../application/wedding-list.repository.port';

import { toWeddingDto, type WeddingRow } from './wedding-mapper';

@Injectable()
export class WeddingRepository implements WeddingListRepositoryPort {
  private readonly logger = new Logger(WeddingRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async insert(input: NewWedding): Promise<WeddingDto> {
    const row = await this.prisma.weddings.create({
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
    return toWeddingDto(row);
  }

  async list(args: ListArgs): Promise<WeddingDto[]> {
    const rows = await this.prisma.weddings.findMany({
      where: toPrismaWhere(args.filter),
      orderBy: toPrismaOrderBy(args.orderBy),
      skip: args.skip,
      take: args.take,
      select: this.rowFields,
    });
    return rows.map(toWeddingDto);
  }

  async count(filter: WeddingListFilter): Promise<number> {
    return this.prisma.weddings.count({ where: toPrismaWhere(filter) });
  }

  private readonly rowFields = {
    id: true,
    tenant_id: true,
    owner_user_id: true,
    partner_1_name: true,
    partner_2_name: true,
    event_date: true,
    venue_name: true,
    venue_city: true,
    status: true,
    created_at: true,
    created_by_user_id: true,
    updated_at: true,
    updated_by_user_id: true,
  } as const;
}

// -- neutral → Prisma translators (private to the adapter) -----------------

function toPrismaWhere(filter: WeddingListFilter): Prisma.weddingsWhereInput {
  return {
    tenant_id: filter.scope.tenantId,
    ...(filter.scope.ownerUserId !== undefined
      ? { owner_user_id: filter.scope.ownerUserId }
      : {}),
    ...toPrismaStatus(filter.status),
    ...toPrismaSearch(filter.searchTerm),
  };
}

function toPrismaStatus(status: StatusFilter): Prisma.weddingsWhereInput {
  switch (status.kind) {
    case 'all':
      return {};
    case 'exact':
      return { status: status.value };
    case 'active':
      return {
        status: 'published',
        event_date: { gte: status.publishedAfterOrAt },
      };
  }
}

// Case-insensitive substring against either partner column. LIKE
// wildcards are escaped so a literal `_` matches itself only.
function toPrismaSearch(term: string | undefined): Prisma.weddingsWhereInput {
  if (!term) return {};
  const escaped = term
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
  return {
    OR: [
      { partner_1_name: { contains: escaped, mode: 'insensitive' } },
      { partner_2_name: { contains: escaped, mode: 'insensitive' } },
    ],
  };
}

// `id ASC` is a deterministic tiebreaker (ADR-13 §Sorting).
function toPrismaOrderBy(
  orderBy: WeddingListOrderBy,
): Prisma.weddingsOrderByWithRelationInput[] {
  if (orderBy.kind === 'createdAtNewestFirst') {
    return [{ created_at: 'desc' }, { id: 'asc' }];
  }
  return [
    { event_date: 'asc' },
    { created_at: 'desc' },
    { id: 'asc' },
  ];
}

// `WeddingRow` is re-exported so the mapper module owns the shape.
export type { WeddingRow };
