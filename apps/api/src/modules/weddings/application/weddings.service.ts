import { Injectable, Logger } from '@nestjs/common';
import { newId, WeddingStatus } from '@wendy/contracts';
import type { CreateWeddingDto, WeddingDto } from '@wendy/contracts';
import type { WeddingId } from '@wendy/contracts';

import type {
  TenantId,
  UserId,
} from '../../../shared/jwt/jwt.service';
import { WeddingPlannerPrincipal } from '../domain/wedding-planner-principal';
import { WeddingRepository } from '../outbound-adapters/wedding.repository';

/**
 * Application-layer use cases for the Wedding bounded context.
 *
 * US-009 ships only the `createWedding` use case. Subsequent stories
 * (US-010, US-011, US-012, US-013, US-022) extend this class with the
 * read, update, archive, and publish operations — same shape, same
 * module, no cross-context imports.
 *
 * The use case is the integration point for ARC-021 (S3 prefix
 * provisioning on create): when ARC-021 lands, its ensure-prefix hook
 * attaches here without changing the controller or the DTO contract.
 */
@Injectable()
export class WeddingsService {
  private readonly logger = new Logger(WeddingsService.name);

  constructor(private readonly weddingRepository: WeddingRepository) {}

  /**
   * Creates a wedding record under the calling Wedding Planner's
   * tenant and ownership.
   *
   * Behaviour (per functional-spec v1.2.0 + tech-spec v1.2.0):
   *   - `id`, `tenantId`, `ownerUserId`, `createdAt`, and
   *     `createdByUserId` come from the security context — never from
   *     the request body (Rule 2 / Rule 3).
   *   - `status` is always `draft` on create. The FE never picks the
   *     status; lifecycle transitions arrive with US-022 / US-013.
   *   - Past dates are accepted without ceremony. The past-date
   *     warning is a FE-only concern; the BE stores whatever the
   *     request carries (already validated by `class-validator` on the
   *     DTO).
   *   - Whitespace is trimmed from the four text fields to defend
   *     against the `name='  '` edge case (Rule 11 + Rule 12 of the
   *     functional spec).
   */
  async createWedding(
    principal: WeddingPlannerPrincipal,
    dto: CreateWeddingDto,
  ): Promise<WeddingDto> {
    const partner1Name = (dto.partner1Name ?? '').trim();
    const partner2Name = (dto.partner2Name ?? '').trim();
    const venueName = (dto.venueName ?? '').trim();
    const venueCity = (dto.venueCity ?? '').trim();
    const eventDate = (dto.eventDate ?? '').trim();

    // The DTO decorators already enforce the same rules, but trimming
    // after the validators is defensive — a non-breaking surprise if
    // someone wires a future DTO without decorators.
    if (!partner1Name || !partner2Name || !venueName || !venueCity || !eventDate) {
      throw new ValidationError(
        'All fields are required',
        'partner1Name',
      );
    }

    const newWeddingId = newId<WeddingId>();
    const now = new Date();

    const row = await this.weddingRepository.create({
      id: newWeddingId,
      tenantId: principal.tenantId,
      ownerUserId: principal.actorId,
      createdByUserId: principal.actorId,
      updatedByUserId: principal.actorId,
      partner1Name,
      partner2Name,
      // The DTO stores `eventDate` as a string ("YYYY-MM-DD"); Prisma's
      // `Date` column accepts a JS Date — we anchor at UTC midnight so
      // the date is timezone-neutral (calendar-day granularity per
      // tech-spec §Endpoint contract notes).
      eventDate: parseIsoDate(eventDate),
      venueName,
      venueCity,
      status: WeddingStatus.Draft,
      createdAt: now,
      updatedAt: now,
    });

    this.logger.log({
      event: 'wedding.created',
      weddingId: row.id,
      tenantId: row.tenant_id,
      ownerUserId: row.owner_user_id,
      actorId: principal.actorId,
      timestamp: now.toISOString(),
    });

    return toWeddingDto(row);
  }
}

/**
 * Maps the Prisma row into the response DTO. Same shape whether the
 * row came from a create or a future read.
 */
function toWeddingDto(row: {
  id: string;
  tenant_id: string;
  owner_user_id: string;
  partner_1_name: string;
  partner_2_name: string;
  event_date: Date;
  venue_name: string;
  venue_city: string;
  status: string;
  created_at: Date;
  created_by_user_id: string;
}): WeddingDto {
  return {
    id: row.id as WeddingId,
    tenantId: row.tenant_id as TenantId,
    ownerUserId: row.owner_user_id as UserId,
    partner1Name: row.partner_1_name,
    partner2Name: row.partner_2_name,
    eventDate: toIsoDate(row.event_date),
    venueName: row.venue_name,
    venueCity: row.venue_city,
    status: row.status as WeddingStatus,
    createdAt: row.created_at.toISOString(),
    createdByUserId: row.created_by_user_id as UserId,
  };
}

/**
 * `YYYY-MM-DD` → JS Date at UTC midnight. Defensive parse — DTO
 * validation has already checked the format, but a corrupt string
 * would otherwise crash the DB driver with a confusing error.
 */
function parseIsoDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new ValidationError(
      'eventDate must be a calendar-day ISO 8601 date (YYYY-MM-DD)',
      'eventDate',
    );
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * JS Date (midnight UTC) → `YYYY-MM-DD`. Reverses `parseIsoDate`. The
 * stored `event_date` column is `DATE` (no time-of-day) so this is a
 * pure date projection.
 */
function toIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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