import { Inject, Injectable, Logger } from '@nestjs/common';
import { newId, WeddingStatus } from '@wendy/contracts';
import type { CreateWeddingDto, WeddingDto } from '@wendy/contracts';
import type { WeddingId } from '@wendy/contracts';

import type { AuthenticatedUser } from '../../../shared/decorators/current-user.decorator';
import { WeddingPlannerPrincipal } from '../domain/wedding-planner-principal';

import {
  WEDDING_REPOSITORY_PORT,
  type ListArgs,
  type NewWedding,
  type StatusFilter,
  type WeddingListFilter,
  type WeddingListOrderBy,
  type WeddingListRepositoryPort,
} from './wedding-list.repository.port';

@Injectable()
export class WeddingsService {
  private readonly logger = new Logger(WeddingsService.name);

  constructor(
    @Inject(WEDDING_REPOSITORY_PORT)
    private readonly repository: WeddingListRepositoryPort,
  ) {}

  async createWedding(
    principal: WeddingPlannerPrincipal,
    dto: CreateWeddingDto,
  ): Promise<WeddingDto> {
    const partner1Name = (dto.partner1Name ?? '').trim();
    const partner2Name = (dto.partner2Name ?? '').trim();
    const venueName = (dto.venueName ?? '').trim();
    const venueCity = (dto.venueCity ?? '').trim();
    const eventDate = (dto.eventDate ?? '').trim();

    // Belt-and-suspenders: the DTO decorators already enforce these.
    if (!partner1Name || !partner2Name || !venueName || !venueCity || !eventDate) {
      throw new ValidationError(
        'All fields are required',
        'partner1Name',
      );
    }

    const newWeddingId = newId<WeddingId>();
    const now = new Date();

    const created = await this.repository.insert({
      id: newWeddingId,
      tenantId: principal.tenantId,
      ownerUserId: principal.actorId,
      createdByUserId: principal.actorId,
      updatedByUserId: principal.actorId,
      partner1Name,
      partner2Name,
      eventDate: parseIsoDate(eventDate),
      venueName,
      venueCity,
      status: WeddingStatus.Draft,
      createdAt: now,
      updatedAt: now,
    } satisfies NewWedding);

    this.logger.log({
      event: 'wedding.created',
      weddingId: created.id,
      tenantId: created.tenantId,
      ownerUserId: created.ownerUserId,
      actorId: principal.actorId,
      timestamp: now.toISOString(),
    });

    return created;
  }

  async listWeddings(
    caller: AuthenticatedUser,
    query: ListWeddingsQuery,
  ): Promise<{ items: WeddingDto[]; total: number }> {
    const filter = buildFilter(caller, query);
    const orderBy = buildOrderBy(query.sort);
    const args: ListArgs = {
      filter,
      orderBy,
      skip: query.offset,
      take: query.limit,
    };

    const [items, total] = await Promise.all([
      this.repository.list(args),
      this.repository.count(filter),
    ]);

    this.logger.log({
      event: 'weddings.listed',
      tenantId: caller.tenantId,
      role: caller.role,
      actorId: caller.id,
      query: {
        search: query.search ?? null,
        status: query.status ?? 'all',
        sort: query.sort ?? 'date',
        limit: query.limit,
        offset: query.offset,
        returned: items.length,
        total,
      },
      timestamp: new Date().toISOString(),
    });

    return { items, total };
  }
}

export interface ListWeddingsQuery {
  search?: string;
  status?: 'all' | 'active' | 'draft' | 'archived';
  sort?: 'date' | 'added';
  limit: number;
  offset: number;
}

// Wedding Planner → owns the row. Administrator → every row in the
// tenant (the WP-vs-WP fence is intentionally dropped — see ADR-05).
function buildFilter(
  caller: AuthenticatedUser,
  query: ListWeddingsQuery,
): WeddingListFilter {
  const scope =
    caller.role === 'WeddingPlanner'
      ? { tenantId: caller.tenantId, ownerUserId: caller.id }
      : { tenantId: caller.tenantId };
  const searchTerm = query.search?.trim() || undefined;
  return {
    scope,
    status: toStatusFilter(query.status),
    searchTerm,
  };
}

function toStatusFilter(s: ListWeddingsQuery['status']): StatusFilter {
  switch (s) {
    case 'draft':
      return { kind: 'exact', value: 'draft' };
    case 'archived':
      return { kind: 'exact', value: 'archived' };
    case 'active':
      return { kind: 'active', publishedAfterOrAt: startOfTodayUtc() };
    case 'all':
    case undefined:
    default:
      return { kind: 'all' };
  }
}

function buildOrderBy(sort: ListWeddingsQuery['sort']): WeddingListOrderBy {
  return sort === 'added'
    ? { kind: 'createdAtNewestFirst' }
    : { kind: 'eventDateUpcomingFirst' };
}

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function parseIsoDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new ValidationError(
      'eventDate must be a calendar-day ISO 8601 date (YYYY-MM-DD)',
      'eventDate',
    );
  }
  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
