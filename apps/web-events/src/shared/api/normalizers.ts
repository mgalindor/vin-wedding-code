/**
 * Runtime normalizers for DTOs that come back from the BE with nullable
 * fields where the FE expects a populated shape.
 *
 * **Why this lives here and not in each consumer.** The BE legitimately
 * sends `null` for `locations` / `program` / `contacts` on a freshly-
 * created event (the row exists, the payloads don't yet). Two ways to
 * deal with that:
 *
 *   1. Every consumer does `event.locations?.items ?? []`. Works, but
 *      the defensive code spreads across every screen that renders the
 *      event and grows with the number of consumers.
 *   2. Apply the substitution once at the API boundary. Every consumer
 *      below the boundary can trust the shape. This file.
 *
 * The TYPE still declares `locations: LocationsPayload | null` — see
 * `shared/api/types.ts`. The normalizer does not lie about the wire
 * contract; it just gives the in-memory value a guaranteed shape. New
 * consumers should still prefer `?.` for safety, but the normalizer
 * removes the foot-gun.
 *
 * The companion `shared/api/schemas.ts` validates the wire shape via
 * Zod before this normalizer runs; the normalizer only substitutes
 * known-good defaults.
 */

import type {
  ContactsPayload,
  EventDto,
  LocationsPayload,
  ProgramPayload,
} from './types';

const EMPTY_LOCATIONS: LocationsPayload = { items: [] };
const EMPTY_PROGRAM: ProgramPayload = { items: [] };
const EMPTY_CONTACTS: ContactsPayload = {};

export function normalizeEventDto(dto: EventDto): EventDto {
  return {
    ...dto,
    locations: dto.locations ?? EMPTY_LOCATIONS,
    program: dto.program ?? EMPTY_PROGRAM,
    contacts: dto.contacts ?? EMPTY_CONTACTS,
  };
}