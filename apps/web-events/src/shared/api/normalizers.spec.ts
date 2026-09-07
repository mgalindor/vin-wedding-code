import { normalizeEventDto } from './normalizers';
import type { EventDto } from './types';

const baseEvent: EventDto = {
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

describe('normalizeEventDto', () => {
  it('replaces a null locations payload with an empty items array', () => {
    const normalized = normalizeEventDto({ ...baseEvent, locations: null });
    expect(normalized.locations).toEqual({ items: [] });
  });

  it('replaces a null program payload with an empty items array', () => {
    const normalized = normalizeEventDto({ ...baseEvent, program: null });
    expect(normalized.program).toEqual({ items: [] });
  });

  it('replaces a null contacts payload with an empty entries array', () => {
    const normalized = normalizeEventDto({ ...baseEvent, contacts: null });
    expect(normalized.contacts).toEqual({ entries: [] });
  });

  it('preserves populated payloads as-is', () => {
    const populated: EventDto = {
      ...baseEvent,
      locations: { items: [{ label: 'Ceremony' }] },
      program: { items: [{ time: '18:00', title: 'Ceremony' }] },
      contacts: { entries: [{ label: 'Primary', fullName: 'Maya' }] },
    };
    expect(normalizeEventDto(populated)).toEqual(populated);
  });

  it('does not mutate the input DTO', () => {
    const input: EventDto = { ...baseEvent };
    normalizeEventDto(input);
    expect(input.locations).toBeNull();
    expect(input.program).toBeNull();
    expect(input.contacts).toBeNull();
  });

  describe('wire → FE in-memory translation', () => {
    it('flattens `{ entries: [...] }` from the BE to `items: [...]`', () => {
      const wire: EventDto = {
        ...baseEvent,
        locations: {
          // Force the wire shape to pass through the strict TS check
          entries: [
            { label: 'Ceremony', name: 'Chapel', address: '123 Main', mapsLink: 'https://…' },
          ],
        } as unknown as EventDto['locations'],
      };
      const normalized = normalizeEventDto(wire);
      expect(normalized.locations?.items).toHaveLength(1);
      expect(normalized.locations?.items[0]).toMatchObject({
        label: 'Ceremony',
        address: '123 Main',
        mapUrl: 'https://…',
      });
    });

    it('flattens `{ days: [...] }` to a single `items` list', () => {
      const wire: EventDto = {
        ...baseEvent,
        program: {
          days: [
            {
              date: '2027-04-15',
              label: 'Wedding day',
              items: [
                { time: '18:00', title: 'Ceremony', detail: 'chapel' },
                { time: '20:00', title: 'Reception', detail: 'garden' },
              ],
            },
          ],
        } as unknown as EventDto['program'],
      };
      const normalized = normalizeEventDto(wire);
      expect(normalized.program?.items).toHaveLength(2);
      expect(normalized.program?.items[0]).toMatchObject({ time: '18:00', title: 'Ceremony' });
    });
  });
});
