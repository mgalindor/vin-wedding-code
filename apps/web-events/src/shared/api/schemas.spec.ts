import { EventDtoSchema } from './schemas';

describe('EventDtoSchema', () => {
  const validEvent = {
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

  it('accepts the freshly-created event shape from the BE (nullable payloads)', () => {
    expect(EventDtoSchema.safeParse(validEvent).success).toBe(true);
  });

  it('accepts a fully-populated event', () => {
    const populated = {
      ...validEvent,
      locations: { items: [{ label: 'Ceremony', address: '1 St' }] },
      program: { items: [{ time: '18:00', title: 'Ceremony' }] },
      contacts: { primaryContactName: 'Maya' },
    };
    expect(EventDtoSchema.safeParse(populated).success).toBe(true);
  });

  it('rejects an unknown eventType (drift detection)', () => {
    const drift = { ...validEvent, eventType: 'christening' };
    const result = EventDtoSchema.safeParse(drift);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('eventType');
    }
  });

  it('rejects a malformed eventDate', () => {
    const drift = { ...validEvent, eventDate: '15/04/2027' };
    expect(EventDtoSchema.safeParse(drift).success).toBe(false);
  });

  it('rejects a missing field (drift detection)', () => {
    const drift = { ...validEvent };
    delete (drift as Record<string, unknown>)['status'];
    expect(EventDtoSchema.safeParse(drift).success).toBe(false);
  });

  it('rejects locations as a string instead of the object shape', () => {
    const drift = { ...validEvent, locations: 'something' };
    expect(EventDtoSchema.safeParse(drift).success).toBe(false);
  });
});