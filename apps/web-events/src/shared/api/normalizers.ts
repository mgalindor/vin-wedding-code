/**
 * Runtime normalizers for DTOs that come back from the BE.
 *
 * **Two responsibilities, kept distinct:**
 *
 *   1. **Null defaults.** The BE legitimately sends `null` for the
 *      generic payloads (`locations` / `program` / `contacts`) on a
 *      freshly-created event — the row exists, the payloads don't yet.
 *      Substitute `[]`/`{}` so consumers never crash on `undefined`.
 *
 *   2. **Wire → in-memory shape translation.** The BE wire shape and
 *      the FE in-memory shape diverge for the JSONB payloads:
 *        - `locations.items` (FE)  ←  `locations.entries` (BE)
 *        - `program.items`   (FE)  ←  `program.days[*].items` (BE — multi-day)
 *        - `contacts.entries` (FE) ←  `contacts.entries` (BE — same name)
 *      The transform happens here, once, so the rest of the FE sees a
 *      single stable shape declared in `shared/api/types.ts`.
 *
 * **The boundary contract:** every service / hook that calls the API
 * runs `normalizeXxx()` before handing off to a screen. Screens never
 * see the raw wire shape. Schemas parse the wire shape (see
 * `shared/api/schemas.ts`) and normalizers translate it.
 */

import type {
  ContactsPayload,
  EventDto,
  EventLocation,
  LocationsPayload,
  ProgramItem,
  ProgramPayload,
} from './types';

const EMPTY_LOCATIONS: LocationsPayload = { items: [] };
const EMPTY_PROGRAM: ProgramPayload = { items: [] };
const EMPTY_CONTACTS: ContactsPayload = { entries: [] };

/**
 * Translate the BE wire shape for the locations payload into the FE
 * in-memory shape. The wire carries `{ entries: LocationEntry[] }`;
 * the FE works with a flat `{ items: EventLocation[] }` (single-day
 * event-friendly view). Multi-day flattening is on the BE — `entries`
 * already represents the canonical ordered list.
 *
 * Unknown fields on each entry are passed through so a future BE
 * addition (e.g. `room` for a hotel block) doesn't silently drop.
 */
function normalizeLocations(raw: unknown): LocationsPayload {
  if (!raw || typeof raw !== 'object') return EMPTY_LOCATIONS;
  const wire = raw as { entries?: unknown };
  const list = Array.isArray(wire.entries) ? wire.entries : [];
  const items: EventLocation[] = list.map((e) => {
    const entry = (e ?? {}) as Record<string, unknown>;
    return {
      id: typeof entry['id'] === 'string' ? (entry['id'] as string) : undefined,
      label: typeof entry['label'] === 'string' ? (entry['label'] as string) : '',
      name: typeof entry['name'] === 'string' ? (entry['name'] as string) : undefined,
      address: typeof entry['address'] === 'string' ? (entry['address'] as string) : undefined,
      city: typeof entry['city'] === 'string' ? (entry['city'] as string) : undefined,
      startsAt:
        typeof entry['time'] === 'string'
          ? (entry['time'] as string)
          : typeof entry['startsAt'] === 'string'
            ? (entry['startsAt'] as string)
            : undefined,
      notes: typeof entry['notes'] === 'string' ? (entry['notes'] as string) : undefined,
      mapUrl:
        typeof entry['mapsLink'] === 'string'
          ? (entry['mapsLink'] as string)
          : typeof entry['mapUrl'] === 'string'
            ? (entry['mapUrl'] as string)
            : undefined,
    };
  });
  return { items };
}

/**
 * The BE sends the program as `{ days: [{ date, label, items[] }] }`
 * — multi-day aware. The FE flattens it to a single ordered list. Days
 * are concatenated in `date` order; within a day, items keep server
 * order. When the BE returns no `days`, we still produce an empty
 * `items` array.
 */
function normalizeProgram(raw: unknown): ProgramPayload {
  if (!raw || typeof raw !== 'object') return EMPTY_PROGRAM;
  const wire = raw as { days?: unknown };
  const days = Array.isArray(wire.days) ? wire.days : [];
  const items: ProgramItem[] = [];
  for (const day of days) {
    const d = (day ?? {}) as { items?: unknown };
    if (!Array.isArray(d.items)) continue;
    for (const it of d.items) {
      const item = (it ?? {}) as Record<string, unknown>;
      if (typeof item['time'] !== 'string' || typeof item['title'] !== 'string') continue;
      items.push({
        time: item['time'] as string,
        title: item['title'] as string,
        detail:
          typeof item['detail'] === 'string'
            ? (item['detail'] as string)
            : typeof item['description'] === 'string'
              ? (item['description'] as string)
              : undefined,
      });
    }
  }
  return { items };
}

/**
 * The BE and FE agree on the shape name (`entries`) for contacts, but
 * the FE types it as `{ entries: Array<{ fullName?, phone?, email?, label? }> }`.
 * We normalise the `fullName → fullName` (kept identical) and pass
 * unknown fields through.
 */
function normalizeContacts(raw: unknown): ContactsPayload {
  if (!raw || typeof raw !== 'object') return EMPTY_CONTACTS;
  const wire = raw as { entries?: unknown };
  const list = Array.isArray(wire.entries) ? wire.entries : [];
  const entries = list.map((e) => {
    const entry = (e ?? {}) as Record<string, unknown>;
    return {
      label: typeof entry['label'] === 'string' ? (entry['label'] as string) : undefined,
      fullName: typeof entry['fullName'] === 'string' ? (entry['fullName'] as string) : '',
      phone: typeof entry['phone'] === 'string' ? (entry['phone'] as string) : undefined,
      email: typeof entry['email'] === 'string' ? (entry['email'] as string) : undefined,
    };
  });
  return { entries };
}

/**
 * Translate the BE wire `EventDto` into the FE in-memory shape. The
 * top-level scalars (id, organizerId, eventType, title, eventDate,
 * status, createdAt, updatedAt) match; only the three JSONB payloads
 * need translation. Null payloads get a real default so downstream
 * `?.` is optional.
 */
export function normalizeEventDto(dto: EventDto): EventDto {
  return {
    ...dto,
    locations: dto.locations ? normalizeLocations(dto.locations) : EMPTY_LOCATIONS,
    program: dto.program ? normalizeProgram(dto.program) : EMPTY_PROGRAM,
    contacts: dto.contacts ? normalizeContacts(dto.contacts) : EMPTY_CONTACTS,
  };
}

/* Re-exports so consumers that don't already import the helpers can
 * reach them in one hop. */
export { normalizeLocations, normalizeProgram, normalizeContacts };
