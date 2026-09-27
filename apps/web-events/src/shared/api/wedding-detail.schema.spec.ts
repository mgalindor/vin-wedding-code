import { describe, expect, it } from 'vitest';

import { WeddingDetailDtoSchema } from './schemas';

const realResponse = {
  eventId: 'das4a6hb1d056av8g48g',
  partner1Name: 'Maria Marquez',
  partner2Name: 'Javier Godinez',
  countdownEnabled: false,
  landing: { preTitle: null },
  story: {
    body: 'Nos conocimos una tarde de primavera…',
  },
  dressCode: {
    entries: [
      { title: 'Civil', body: 'Casual' },
      { title: 'Ceremonia', body: 'Cocktail' },
    ],
  },
  giftRegistry: {
    links: [],
    notes: null,
  },
  parents: {
    partner1Label: null,
    partner1Names: [],
    partner2Label: null,
    partner2Names: [],
  },
  accommodation: {
    entries: [],
  },
};

describe('WeddingDetailDtoSchema', () => {
  it('parses the real BE response shape without errors', () => {
    const parsed = WeddingDetailDtoSchema.parse(realResponse);
    expect(parsed.eventId).toBe('das4a6hb1d056av8g48g');
    expect(parsed.partner1Name).toBe('Maria Marquez');
    expect(parsed.dressCode?.entries).toHaveLength(2);
    expect(parsed.parents?.partner1Label).toBeNull();
  });

  it('accepts a minimal payload (only eventId required)', () => {
    const parsed = WeddingDetailDtoSchema.parse({ eventId: 'evt-1' });
    expect(parsed.eventId).toBe('evt-1');
    expect(parsed.story).toBeUndefined();
    expect(parsed.dressCode).toBeUndefined();
  });

  it('rejects payloads missing eventId', () => {
    expect(() => WeddingDetailDtoSchema.parse({ partner1Name: 'X' })).toThrow();
  });

  it('preserves nested dressCode.entries when present', () => {
    const parsed = WeddingDetailDtoSchema.parse(realResponse);
    expect(parsed.dressCode?.entries?.[0]).toEqual({ title: 'Civil', body: 'Casual' });
  });

  it('treats giftRegistry.links as optional and accepts null', () => {
    const parsed = WeddingDetailDtoSchema.parse({
      eventId: 'evt-1',
      giftRegistry: { notes: 'Bank transfer', links: null },
    });
    expect(parsed.giftRegistry?.notes).toBe('Bank transfer');
    expect(parsed.giftRegistry?.links).toBeNull();
  });
});