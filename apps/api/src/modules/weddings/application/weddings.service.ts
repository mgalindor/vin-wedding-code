import { Inject, Injectable, Logger } from '@nestjs/common';
import { newId, WeddingStatus } from '@wendy/contracts';
import type {
  CreateWeddingDto,
  UpdateWeddingDto,
  WeddingDto,
} from '@wendy/contracts';
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
  type WeddingUpdateFields,
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
      // Optional ceremony start time — null when omitted so the FE
      // can keep showing the default 18:00 placeholder before the WP
      // overrides it. The BE never invents a value here.
      startTime: parseStartTime(dto.startTime),
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

  // US-010: read a single wedding the caller owns (WP) or any wedding
  // in their tenant (Admin). Mirrors the role-aware scope the list
  // endpoint already applies (US-011 v1.1.0).
  async getWedding(
    caller: AuthenticatedUser,
    id: string,
  ): Promise<WeddingDto> {
    const scope = buildScope(caller);
    const wedding = await this.repository.findById({ scope, id });
    if (!wedding) {
      // No enumeration — same envelope every other unauthorized /
      // missing case surfaces.
      throw new WeddingNotFoundError(id);
    }
    return wedding;
  }

  // US-010: update the five basic-detail fields. Refuses archived
  // weddings with the same generalized envelope a 404 would use —
  // archived weddings are owned by US-013. Belt-and-suspenders: the
  // DTO decorators already enforce the field-level rules.
  async updateWedding(
    principal: WeddingPlannerPrincipal,
    id: string,
    dto: UpdateWeddingDto,
  ): Promise<WeddingDto> {
    const partner1Name = (dto.partner1Name ?? '').trim();
    const partner2Name = (dto.partner2Name ?? '').trim();
    const venueName = (dto.venueName ?? '').trim();
    const venueCity = (dto.venueCity ?? '').trim();
    const eventDate = (dto.eventDate ?? '').trim();

    if (!partner1Name || !partner2Name || !venueName || !venueCity || !eventDate) {
      throw new ValidationError(
        'All fields are required',
        'partner1Name',
      );
    }

    // The controller enforces `@Roles('WeddingPlanner')`, so the
    // principal is always a WP — the scope is always tenant + owner.
    const scope = {
      tenantId: principal.tenantId,
      ownerUserId: principal.actorId,
    };

    // Verify the row exists AND is owned by the caller BEFORE the
    // update — the update port cannot tell us "archived vs missing",
    // and we want the same envelope for both refusals.
    const existing = await this.repository.findById({ scope, id });
    if (!existing || existing.status === WeddingStatus.Archived) {
      throw new WeddingNotFoundError(id);
    }

    const now = new Date();
    const fields: WeddingUpdateFields = {
      partner1Name,
      partner2Name,
      eventDate: parseIsoDate(eventDate),
      // The PATCH always carries the field (even as null when the WP
      // clears it) — there's no concept of "leave unchanged" yet, and
      // the form always sends the current input value.
      startTime: parseStartTime(dto.startTime),
      venueName,
      venueCity,
      updatedByUserId: principal.actorId,
      updatedAt: now,
    };

    const updated = await this.repository.updateById({ scope, id, fields });
    if (!updated) {
      // Race: the row was deleted between findById and updateById.
      // In MVP rows are not deleted (US-009 functional spec Rule 17),
      // so this branch is defensive — surface the same envelope.
      throw new WeddingNotFoundError(id);
    }

    this.logger.log({
      event: 'wedding.updated',
      weddingId: updated.id,
      tenantId: updated.tenantId,
      ownerUserId: updated.ownerUserId,
      actorId: principal.actorId,
      timestamp: now.toISOString(),
    });

    return updated;
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
// Reuses `buildScope` so the role-aware boundary lives in one place.
function buildFilter(
  caller: AuthenticatedUser,
  query: ListWeddingsQuery,
): WeddingListFilter {
  const searchTerm = query.search?.trim() || undefined;
  return {
    scope: buildScope(caller),
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

// Translate the optional HH:mm wire value into the neutral port
// shape. Empty string / undefined / null all land as null so the BE
// never stores an invented placeholder.
function parseStartTime(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) {
    throw new ValidationError(
      'startTime must be HH:mm (24-hour)',
      'startTime',
    );
  }
  return trimmed;
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

// US-010: raised when the requested wedding does not exist OR the
// caller is not allowed to see / update it. No detail, no enumeration
// — the controller maps this to the same envelope a 404 would use.
export class WeddingNotFoundError extends Error {
  constructor(public readonly weddingId: string) {
    super(`Wedding "${weddingId}" not found`);
    this.name = 'WeddingNotFoundError';
  }
}

// Shared scope builder: WP→own rows (tenant + owner), Admin→whole
// tenant. Used by both the list (US-011) and the read / update
// (US-010) use cases so the role-aware boundary lives in one place.
function buildScope(caller: AuthenticatedUser): {
  tenantId: string;
  ownerUserId?: string;
} {
  return caller.role === 'WeddingPlanner'
    ? { tenantId: caller.tenantId, ownerUserId: caller.id }
    : { tenantId: caller.tenantId };
}
