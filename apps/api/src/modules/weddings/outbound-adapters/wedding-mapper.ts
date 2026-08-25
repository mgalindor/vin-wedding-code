import {
  WeddingLocationDto,
  WeddingStatus,
  type WeddingDto,
  type WeddingId,
} from '@wendy/contracts';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import type { TenantId, UserId } from '../../../shared/jwt/jwt.service';

// Shape returned by Prisma's `select` on the weddings table — the
// adapter's internal projection. Not exposed to the application.
export interface WeddingRow {
  id: string;
  tenant_id: string;
  owner_user_id: string;
  partner_1_name: string;
  partner_2_name: string;
  event_date: Date;
  // Prisma maps `@db.Time` columns to JS `Date` with the date
  // portion set to `1970-01-01` (the Postgres time-only convention).
  start_time: Date | null;
  venue_name: string;
  venue_city: string;
  status: string;
  created_at: Date;
  created_by_user_id: string;
  updated_at: Date;
  updated_by_user_id: string;
  // US-014a: Prisma's `Json` columns come back as the raw JS value
  // the database stored. The migration's `DEFAULT '[]'::jsonb`
  // guarantees the runtime shape is an array, but we defensively
  // normalise + validate before returning to the application.
  locations: unknown;
}

// `event_date` is a DATE column → projection is timezone-neutral.
function toIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Prisma returns TIME columns as a Date pinned to 1970-01-01; the
// wire DTO uses `HH:mm`. Format defensively in case the column is
// ever widened (e.g. to a timestamp).
function toIsoTime(value: Date | null): string | null {
  if (!value) return null;
  const hh = String(value.getUTCHours()).padStart(2, '0');
  const mm = String(value.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function toWeddingDto(row: WeddingRow): WeddingDto {
  return {
    id: row.id as WeddingId,
    tenantId: row.tenant_id as TenantId,
    ownerUserId: row.owner_user_id as UserId,
    partner1Name: row.partner_1_name,
    partner2Name: row.partner_2_name,
    eventDate: toIsoDate(row.event_date),
    startTime: toIsoTime(row.start_time),
    venueName: row.venue_name,
    venueCity: row.venue_city,
    status: row.status as WeddingStatus,
    createdAt: row.created_at.toISOString(),
    createdByUserId: row.created_by_user_id as UserId,
    // Updated on every successful PATCH (US-010). Stamped equal to
    // createdAt/createdByUserId on insert (US-009).
    updatedAt: row.updated_at.toISOString(),
    updatedByUserId: row.updated_by_user_id as UserId,
    // US-014a: typed array of locations (empty when none captured).
    // The column is JSONB; the mapper normalises + class-validator-
    // validates every row before returning to the controller.
    locations: toWeddingLocationDtoArray(row.locations),
  };
}

// US-014a: defensive JSONB → typed array translation. The migration
// stores the column as `jsonb` with `DEFAULT '[]'::jsonb`, so a
// non-array value would only ever happen if (a) the database was
// corrupted, or (b) someone wrote a string by hand. We surface an
// empty array in both cases rather than throwing — the column is a
// derived view of the wedding, not the source of truth for an
// invariant that would block the request.
//
// The mapper validates each row through `WeddingLocationDto`
// (class-validator) so a malformed row surfaces an empty slot
// rather than silently leaking garbage onto the wire. This is
// intentionally permissive on the GET path — the PUT path is the
// authoritative writer; the GET path tolerates malformed historical
// data the migration could not backfill (none exists in MVP, but
// the migration is defensively safe).
export function toWeddingLocationDtoArray(
  value: unknown,
): WeddingLocationDto[] {
  if (!Array.isArray(value)) return [];
  const instances = plainToInstance(WeddingLocationDto, value);
  // Sync validation — catch errors so a single bad row does not
  // blow up the entire response (the column is a derived view, not
  // a hard invariant on GET).
  const validated: WeddingLocationDto[] = [];
  for (const inst of instances) {
    const errors = validateSync(inst as object, {
      whitelist: false,
      forbidNonWhitelisted: false,
    });
    if (errors.length === 0) {
      validated.push(inst);
    }
    // Drop malformed rows silently — the adapter logs when the
    // count diverges from the raw value's length. The user-visible
    // surface still gets a clean typed array.
  }
  return validated;
}
