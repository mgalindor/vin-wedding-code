import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

import type { TenantId, UserId, WeddingId } from '../ids.js';

/**
 * Wedding lifecycle status (per ARC-019).
 *
 * - `draft`     — initial state when a Wedding Planner creates a wedding
 *                 via `POST /api/v1/weddings`. The row is always `draft`
 *                 until the invitation-publish flow (US-022) flips it to
 *                 `published`, or the archive flow (US-013) flips it to
 *                 `archived`.
 * - `published` — the wedding has a published invitation. Landed by US-022.
 * - `archived`  — the wedding is closed and removed from the active view.
 *                 Landed by US-013.
 *
 * The FE never lets the WP pick this value; the create endpoint always
 * writes `draft`.
 */
export enum WeddingStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived',
}

/**
 * Input contract for `POST /api/v1/weddings`.
 *
 * The five captured fields are all required (see functional-spec.md
 * Rule 10 — v1.2.0). `tenantId`, `ownerUserId`, and `createdByUserId`
 * are deliberately NOT in this DTO: the platform reads them from the
 * JWT security context, never from the request body.
 *
 * The character limits are the same ones the form enforces via
 * `classValidatorResolver` on the FE — single source of truth.
 */
export class CreateWeddingDto {
  @IsString({ message: 'partner1Name must be a string' })
  @IsNotEmpty({ message: 'partner1Name is required' })
  @MaxLength(120, { message: 'partner1Name is too long' })
  partner1Name!: string;

  @IsString({ message: 'partner2Name must be a string' })
  @IsNotEmpty({ message: 'partner2Name is required' })
  @MaxLength(120, { message: 'partner2Name is too long' })
  partner2Name!: string;

  /**
   * ISO 8601 calendar-day (YYYY-MM-DD). Past dates are accepted (the
   * past-date warning is a FE-only concern; the BE stores whatever the
   * request carries).
   */
  @IsDateString(
    { strict: true },
    { message: 'eventDate must be an ISO 8601 date (YYYY-MM-DD)' },
  )
  eventDate!: string;

  @IsString({ message: 'venueName must be a string' })
  @IsNotEmpty({ message: 'venueName is required' })
  @MaxLength(120, { message: 'venueName is too long' })
  venueName!: string;

  @IsString({ message: 'venueCity must be a string' })
  @IsNotEmpty({ message: 'venueCity is required' })
  @MaxLength(120, { message: 'venueCity is too long' })
  venueCity!: string;

  /**
   * Ceremony start time as `HH:mm` (24-hour, local to the wedding
   * venue). Optional on create — omit or pass null to leave the
   * countdown banner's 18:00 fallback in place. Stored as a plain
   * string on the wire to avoid timezone drift.
   */
  @IsOptional()
  @IsString({ message: 'startTime must be a string' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime must match HH:mm (24-hour)',
  })
  startTime?: string | null;
}

/**
 * Response shape returned by `POST /api/v1/weddings`, `GET /api/v1/weddings/{id}`,
 * `PATCH /api/v1/weddings/{id}`, and every row inside the list response
 * (`GET /api/v1/weddings`).
 *
 * The `tenantId`, `ownerUserId`, `createdByUserId`, and `updatedByUserId`
 * are echoed from the security context / row for traceability — the FE
 * never sends them and the BE never trusts an incoming value.
 *
 * `updatedAt` and `updatedByUserId` were added with US-010 (Update a
 * wedding's basic details) so the detail screen can render the last-edited
 * stamp without a second call. They are present on every response — on a
 * freshly created row `updatedAt === createdAt` and `updatedByUserId ===
 * createdByUserId` (US-009 already stamps them equal on insert).
 */
export class WeddingDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{6,64}$/, {
    message: 'id must be a 6-64 char NanoId',
  })
  id!: WeddingId;

  @IsString()
  @Matches(/^[A-Za-z0-9_-]{6,64}$/, {
    message: 'tenantId must be a 6-64 char NanoId',
  })
  tenantId!: TenantId;

  @IsString()
  @Matches(/^[A-Za-z0-9_-]{6,64}$/, {
    message: 'ownerUserId must be a 6-64 char NanoId',
  })
  ownerUserId!: UserId;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  partner1Name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  partner2Name!: string;

  @IsDateString(
    { strict: true },
    { message: 'eventDate must be an ISO 8601 date (YYYY-MM-DD)' },
  )
  eventDate!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  venueName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  venueCity!: string;

  /**
   * Ceremony start time (HH:mm, venue-local). Echoes back whatever
   * the create/update flow set; null when unset.
   */
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime must match HH:mm (24-hour)',
  })
  startTime!: string | null;

  @IsEnum(WeddingStatus, {
    message: 'status must be draft, published, or archived',
  })
  status!: WeddingStatus;

  @IsString()
  createdAt!: string;

  @IsString()
  @Matches(/^[A-Za-z0-9_-]{6,64}$/, {
    message: 'createdByUserId must be a 6-64 char NanoId',
  })
  createdByUserId!: UserId;

  @IsString()
  updatedAt!: string;

  @IsString()
  @Matches(/^[A-Za-z0-9_-]{6,64}$/, {
    message: 'updatedByUserId must be a 6-64 char NanoId',
  })
  updatedByUserId!: UserId;
}

/**
 * Input contract for `PATCH /api/v1/weddings/{id}` (US-010).
 *
 * The five captured fields are all required (see functional-spec.md
 * Rule 5 — v1.0.0). `tenantId`, `ownerUserId`, `status`, `createdAt`,
 * `createdByUserId`, `updatedAt`, and `updatedByUserId` are deliberately
 * NOT in this DTO: the platform reads them from the row / security
 * context, never from the request body.
 *
 * The class extends `CreateWeddingDto` so the same `class-validator`
 * decorators (and therefore the same field-level error messages) flow to
 * both layers — single source of truth per ADR-14. No fields are added
 * by the child class; the subclass exists so the FE and the OpenAPI
 * generator see a distinct type that names the use case.
 */
export class UpdateWeddingDto extends CreateWeddingDto {}

// `active` is a derived filter (status='published' AND event_date
// >= today) — encoded in the BE service, not in the stored column.
export type WeddingListStatus = 'all' | 'active' | 'draft' | 'archived';
export const WeddingListStatus = {
  All: 'all',
  Active: 'active',
  Draft: 'draft',
  Archived: 'archived',
} as const satisfies Record<string, WeddingListStatus>;

export type WeddingListSort = 'date' | 'added';
export const WeddingListSort = {
  Date: 'date',
  Added: 'added',
} as const satisfies Record<string, WeddingListSort>;

export class ListWeddingsQueryDto {
  @IsOptional()
  @IsString({ message: 'search must be a string' })
  @MaxLength(120, { message: 'search is too long' })
  search?: string;

  @IsOptional()
  @IsEnum(WeddingListStatus, {
    message: 'status must be one of: all, active, draft, archived',
  })
  status?: WeddingListStatus;

  @IsOptional()
  @IsEnum(WeddingListSort, {
    message: 'sort must be one of: date, added',
  })
  sort?: WeddingListSort;

  @IsOptional()
  // @Type tells class-transformer to coerce the query string to a
  // number — without it `transform: true` leaves it as a string and
  // @IsInt() rejects it.
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit must be at most 100' })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset must be an integer' })
  @Min(0, { message: 'offset must be at least 0' })
  offset?: number;
}

export class ListWeddingsResponseDto {
  items!: WeddingDto[];

  @IsInt()
  total!: number;

  // String so the wire stays compatible with future cross-language
  // consumers; the FE reads `=== 'true'` to flip a boolean.
  @IsString()
  hasMore!: 'true' | 'false';
}