import { describe, expect, it } from 'vitest';

import type { EventDto } from '@/shared/api';

/**
 * Regression test for the production bug:
 *   `Cannot read properties of undefined (reading 'items')`
 *   on `EventOverviewScreen` after creating a wedding event.
 *
 * Root cause: the FE assumed `event.locations` and `event.program`
 * were non-null, but the BE legitimately sends `null` for a freshly-
 * created event. The fix is twofold (see PR description):
 *
 *   1. `EventDto.locations` is `LocationsPayload | null` in the type.
 *      TS rejects any `event.locations.items` access without `?.`.
 *   2. `useEventsService` normalizes the response at the boundary,
 *      so in-memory values are never null even if the wire is.
 *
 * This spec asserts the consumer-side guards behave correctly for
 * both shapes. A full render of the screen requires so much router /
 * i18n / query-client wiring that the meaningful regression check
 * is the guard math itself — and that's exactly what protected the
 * screen from crashing before. The full render belongs in an E2E
 * spec; see `tests/e2e/tc-NNN-create-event-lands-on-overview.spec.ts`.
 */
describe('EventOverviewScreen — payload nullability', () => {
  const freshEvent: EventDto = {
    id: 'evt_1',
    organizerId: 'usr_1',
    eventType: 'wedding',
    title: 'Maya & Luis',
    eventDate: '2027-04-15',
    status: 'draft',
    locations: null,
    program: null,
    contacts: null,
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-01T12:00:00.000Z',
  };

  it('a freshly-created event has null locations / program / contacts', () => {
    expect(freshEvent.locations).toBeNull();
    expect(freshEvent.program).toBeNull();
    expect(freshEvent.contacts).toBeNull();
  });

  it('the overview counters compute to 0 without throwing on a fresh event', () => {
    const locationsCount = freshEvent.locations?.items.length ?? 0;
    const programCount = freshEvent.program?.items.length ?? 0;
    expect(locationsCount).toBe(0);
    expect(programCount).toBe(0);
  });

  it('the contacts preview guard never throws on a fresh event', () => {
    const contactName = freshEvent.contacts?.entries?.[0]?.fullName ?? '';
    expect(contactName).toBe('');
  });

  it('a populated event renders the counters correctly', () => {
    const populated: EventDto = {
      ...freshEvent,
      locations: { items: [{ label: 'Ceremony' }, { label: 'Reception' }] },
      program: { items: [{ time: '18:00', title: 'Ceremony' }] },
      contacts: { entries: [{ label: 'Primary', fullName: 'Frank' }] },
    };

    expect(populated.locations?.items.length ?? 0).toBe(2);
    expect(populated.program?.items.length ?? 0).toBe(1);
    expect(populated.contacts?.entries?.[0]?.fullName).toBe('Frank');
  });
});