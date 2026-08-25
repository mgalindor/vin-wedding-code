import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { type WeddingDto } from '@wendy/contracts';

import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  type FindByIdArgs,
  type ListArgs,
  type NewWedding,
  type StatusFilter,
  type UpdateByIdArgs,
  type UpdateLocationsArgs,
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
        start_time: parseStartTime(input.startTime),
        venue_name: input.venueName,
        venue_city: input.venueCity,
        status: input.status,
        created_by_user_id: input.createdByUserId,
        updated_by_user_id: input.updatedByUserId,
        // US-014a: the column defaults to `'[]'::jsonb` on the DB so
        // this field is optional on insert — explicit empty array
        // keeps the row projection consistent with the mapper.
        locations: [],
      },
    });
    return toWeddingDto(row);
  }

  async list(args: ListArgs): Promise<WeddingDto[]> {
    // sort='date' (default): per US-011 functional spec Rule 16 —
    // upcoming weddings (event_date >= today) first by event_date ASC,
    // then past weddings (event_date < today) by event_date DESC.
    // Prisma's `orderBy` doesn't accept arbitrary SQL expressions for
    // a conditional group-by, so the cleanest expression is two
    // findMany calls in parallel + an in-memory merge + skip/take.
    // At MVP scale (~100 weddings per WP per year) the extra fetch is
    // a non-issue; the existing ARC-019 indexes already cover both
    // halves.
    if (args.orderBy.kind === 'eventDateUpcomingFirst') {
      const baseWhere = toPrismaWhere(args.filter);
      const today = startOfTodayUtc();
      const upcomingWhere: Prisma.weddingsWhereInput = {
        ...baseWhere,
        event_date: { gte: today },
      };
      const pastWhere: Prisma.weddingsWhereInput = {
        ...baseWhere,
        event_date: { lt: today },
      };

      const [upcoming, past] = await Promise.all([
        this.prisma.weddings.findMany({
          where: upcomingWhere,
          orderBy: [
            { event_date: 'asc' },
            { created_at: 'desc' },
            { id: 'asc' },
          ],
          select: this.rowFields,
        }),
        this.prisma.weddings.findMany({
          where: pastWhere,
          orderBy: [
            { event_date: 'desc' },
            { created_at: 'desc' },
            { id: 'asc' },
          ],
          select: this.rowFields,
        }),
      ]);

      const merged = [...upcoming, ...past];
      const page = merged.slice(args.skip, args.skip + args.take);
      return page.map(toWeddingDto);
    }

    // sort='added': single query.
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

  // US-010: single-wedding read scoped to the caller. Returns null
  // when no row matches the scope (existence and authorization are
  // collapsed — no enumeration).
  async findById(args: FindByIdArgs): Promise<WeddingDto | null> {
    const row = await this.prisma.weddings.findFirst({
      where: {
        id: args.id,
        ...toScopeWhere(args.scope),
      },
      select: this.rowFields,
    });
    return row ? toWeddingDto(row) : null;
  }

  // US-010: update-by-id scoped to the caller. Uses updateMany (which
  // accepts a non-unique where) followed by findUnique so the returned
  // row reflects the post-mutation state. Returns null when no row
  // matches the scope — the service maps that to the same generalized
  // envelope a 404 would use.
  async updateById(args: UpdateByIdArgs): Promise<WeddingDto | null> {
    const result = await this.prisma.weddings.updateMany({
      where: {
        id: args.id,
        ...toScopeWhere(args.scope),
      },
      data: {
        partner_1_name: args.fields.partner1Name,
        partner_2_name: args.fields.partner2Name,
        event_date: args.fields.eventDate,
        start_time: parseStartTime(args.fields.startTime),
        venue_name: args.fields.venueName,
        venue_city: args.fields.venueCity,
        updated_by_user_id: args.fields.updatedByUserId,
        updated_at: args.fields.updatedAt,
      },
    });
    if (result.count === 0) return null;

    const row = await this.prisma.weddings.findUnique({
      where: { id: args.id },
      select: this.rowFields,
    });
    return row ? toWeddingDto(row) : null;
  }

  // US-014a: replace the `locations` JSONB column with the full
  // ordered array the caller submitted. Uses the same
  // updateMany → findUnique dance as `updateById` so the scope
  // collapses existence + authorization into the same null return.
  async updateLocations(args: UpdateLocationsArgs): Promise<WeddingDto | null> {
    const result = await this.prisma.weddings.updateMany({
      where: {
        id: args.id,
        ...toScopeWhere(args.scope),
      },
      data: {
        locations: args.locations as unknown as Prisma.InputJsonValue,
        updated_by_user_id: args.updatedByUserId,
        updated_at: args.updatedAt,
      },
    });
    if (result.count === 0) return null;

    const row = await this.prisma.weddings.findUnique({
      where: { id: args.id },
      select: this.rowFields,
    });
    return row ? toWeddingDto(row) : null;
  }

  private readonly rowFields = {
    id: true,
    tenant_id: true,
    owner_user_id: true,
    partner_1_name: true,
    partner_2_name: true,
    event_date: true,
    start_time: true,
    venue_name: true,
    venue_city: true,
    status: true,
    created_at: true,
    created_by_user_id: true,
    updated_at: true,
    updated_by_user_id: true,
    // US-014a: the JSONB column projected into the mapper. The
    // mapper defensively validates the array via class-validator.
    locations: true,
  } as const;
}

// -- neutral → Prisma translators (private to the adapter) -----------------

function toScopeWhere(scope: {
  readonly tenantId: string;
  readonly ownerUserId?: string;
}): Prisma.weddingsWhereInput {
  return {
    tenant_id: scope.tenantId,
    ...(scope.ownerUserId !== undefined
      ? { owner_user_id: scope.ownerUserId }
      : {}),
  };
}

function toPrismaWhere(filter: WeddingListFilter): Prisma.weddingsWhereInput {
  return {
    ...toScopeWhere(filter.scope),
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

// Translate the optional HH:mm wire value into a Prisma-compatible
// `Date` (pinned to 1970-01-01 — the Postgres time-only convention).
// Null when the WP hasn't set a value yet.
function parseStartTime(value: string | null): Date | null {
  if (!value) return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return new Date(Date.UTC(1970, 0, 1, Number(match[1]), Number(match[2]), 0));
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

// UTC midnight of "today" — the boundary the upcoming / past split
// uses. Same shape as the one in `weddings.service.ts`; duplicated
// here so the outbound adapter does not import from the application
// layer (per the bounded-context folder rule in ADR-09 / backend
// blueprint §4).
function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

// `WeddingRow` is re-exported so the mapper module owns the shape.
export type { WeddingRow };
