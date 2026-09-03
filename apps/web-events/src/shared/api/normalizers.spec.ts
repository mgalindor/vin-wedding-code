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

  it('replaces a null contacts payload with an empty object', () => {
    const normalized = normalizeEventDto({ ...baseEvent, contacts: null });
    expect(normalized.contacts).toEqual({});
  });

  it('preserves populated payloads as-is', () => {
    const populated: EventDto = {
      ...baseEvent,
      locations: { items: [{ label: 'Ceremony' }] },
      program: { items: [{ time: '18:00', title: 'Ceremony' }] },
      contacts: { primaryContactName: 'Maya' },
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
});