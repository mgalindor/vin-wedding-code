import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

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
}

/**
 * Response shape returned by `POST /api/v1/weddings` (and reused as the
 * read response once `GET /api/v1/weddings/{id}` ships with US-010).
 *
 * The `tenantId`, `ownerUserId`, and `createdByUserId` are echoed from
 * the security context for traceability — the FE never sends them and
 * the BE never trusts an incoming value.
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
}