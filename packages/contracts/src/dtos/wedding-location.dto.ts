/**
 * US-014a — Wedding location contract.
 *
 * A wedding can host multiple events at different venues (ceremony,
 * reception, after party, etc.). Each event is captured as a row on
 * the wedding's `locations` JSONB column; the wire shape is a typed
 * array of {@link WeddingLocationDto} objects — never a plain
 * stringified JSON blob (v1.1.0 storage correction).
 *
 * The DTO is split into two classes:
 *   - `WeddingLocationInputDto` — what the FE PUTs. NO `id` field.
 *     The backend mints a fresh `WeddingLocationId` per row before
 *     persisting (the platform, not the client, owns ID minting —
 *     ADR-13 §Server-minted IDs).
 *   - `WeddingLocationDto` — the response shape (returned by GET
 *     and by the PUT echo). The server-stamped `id` is present so
 *     the FE has a stable identifier for the row after the save.
 *
 * Both the FE and BE share the same classes via `@wendy/contracts`
 * (ADR-14); the classes carry `class-validator` decorators that
 * NestJS's global `ValidationPipe` runs on the BE and
 * `classValidatorResolver` runs on the FE — single source of truth.
 */
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import type { WeddingLocationId } from '../ids.js';

/**
 * Controlled vocabulary for the location `type` field (Rule 7).
 *
 * Closed set: custom location types are explicitly out of MVP
 * (Rule 35). The 6 values are localized in the FE i18n catalogs.
 */
export enum WeddingLocationType {
  CivilCeremony = 'civil_ceremony',
  ReligiousCeremony = 'religious_ceremony',
  Reception = 'reception',
  AfterParty = 'after_party',
  NextDayBrunch = 'next_day_brunch',
  Other = 'other',
}

/**
 * Request shape for a single row inside `PutWeddingLocationsDto`.
 *
 * The `id` field is intentionally absent — the backend mints a fresh
 * `WeddingLocationId` (10-char NanoId) for every row before
 * persisting (ADR-13). The FE tracks rows by array index during
 * editing; after a successful PUT the FE replaces its local state
 * with the server's canonical `WeddingLocationDto[]` and uses the
 * response `id`s as the new React keys.
 *
 * Field-level rules (US-014a functional spec):
 *   - `type`         — required, one of the 6 enum values (Rule 7).
 *   - `venueName`    — required, 1..200 chars, trimmed by service.
 *   - `address`      — required, 1..200 chars, trimmed by service.
 *   - `city`         — required, 1..200 chars, trimmed by service.
 *   - `googleMapsLink` — optional; when present, must be http(s).
 *   - `eventDate`    — required, ISO 8601 date (YYYY-MM-DD).
 *   - `startTime`    — optional, HH:mm (24-hour); empty/null when unset.
 *   - `notes`        — optional, 0..500 chars; rendered verbatim.
 */
export class WeddingLocationInputDto {
  @IsEnum(WeddingLocationType, {
    message:
      'type must be one of: civil_ceremony, religious_ceremony, reception, after_party, next_day_brunch, other',
  })
  type!: WeddingLocationType;

  @IsString({ message: 'venueName must be a string' })
  @IsNotEmpty({ message: 'venueName is required' })
  @MaxLength(200, { message: 'venueName is too long' })
  venueName!: string;

  @IsString({ message: 'address must be a string' })
  @IsNotEmpty({ message: 'address is required' })
  @MaxLength(200, { message: 'address is too long' })
  address!: string;

  @IsString({ message: 'city must be a string' })
  @IsNotEmpty({ message: 'city is required' })
  @MaxLength(200, { message: 'city is too long' })
  city!: string;

  @IsOptional()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'googleMapsLink must be a valid http(s) URL' },
  )
  @MaxLength(500, { message: 'googleMapsLink is too long' })
  googleMapsLink?: string | null;

  @IsDateString(
    { strict: true },
    { message: 'eventDate must be an ISO 8601 date (YYYY-MM-DD)' },
  )
  eventDate!: string;

  @IsOptional()
  @IsString({ message: 'startTime must be a string' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime must match HH:mm (24-hour)',
  })
  startTime?: string | null;

  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  @MaxLength(500, { message: 'notes is too long' })
  notes?: string | null;
}

/**
 * Response shape for a single row (returned by GET and by the PUT
 * echo). Differs from {@link WeddingLocationInputDto} only by the
 * server-minted `id` field — every other field is identical, so the
 * FE can `Object.assign`-style reconcile the response onto its
 * input rows if it ever needs to.
 */
export class WeddingLocationDto extends WeddingLocationInputDto {
  @IsString({ message: 'id must be a string' })
  @Matches(/^[A-Za-z0-9_-]{6,64}$/, {
    message: 'id must be a 6-64 char NanoId',
  })
  id!: WeddingLocationId;
}

/**
 * Body for `PUT /api/v1/weddings/{id}/locations`.
 *
 * The full ordered array replaces whatever the row currently has
 * (Rule 15) — empty array is a valid payload (Rule 23). The cap is
 * generous but bounded so a runaway editor cannot push a single
 * wedding past the JSONB practical size limit (~1MB in Postgres);
 * 200 rows comfortably fits the MVP scale.
 *
 * The array element is `WeddingLocationInputDto` (no `id`) — the
 * backend mints ids server-side before persisting.
 */
export class PutWeddingLocationsDto {
  @IsArray({ message: 'locations must be an array' })
  @ArrayMaxSize(200, { message: 'locations can have at most 200 rows' })
  @ValidateNested({ each: true })
  @Type(() => WeddingLocationInputDto)
  locations!: WeddingLocationInputDto[];
}