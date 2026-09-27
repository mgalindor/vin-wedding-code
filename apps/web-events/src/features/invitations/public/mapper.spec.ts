import { describe, expect, it } from 'vitest';

import type { PublicInvitationDto, WeddingDetailDto } from '@/shared/api';

import { mapPublicInvitationDtoToData } from './mapper';

const baseDto = (overrides: Partial<WeddingDetailDto> = {}): PublicInvitationDto => ({
  slug: 'maria-y-javier',
  active: true,
  rsvpEnabled: false,
  template: {
    id: 'tpl-wedding-botanic',
    code: 'wedding-botanic',
    name: 'Botanic',
    eventType: 'wedding',
  },
  event: {
    id: 'das4a6hb1d056av8g48g',
    organizerId: 'org-1',
    eventType: 'wedding',
    title: 'Maria & Javier',
    eventDate: '2026-10-31',
    status: 'draft',
    updatedAt: '2026-09-26T00:00:00Z',
    locations: null,
    program: null,
    contacts: null,
  },
  weddingDetail: {
    eventId: 'das4a6hb1d056av8g48g',
    partner1Name: 'Maria',
    partner2Name: 'Javier',
    countdownEnabled: false,
    landing: null,
    story: null,
    dressCode: null,
    giftRegistry: null,
    parents: null,
    accommodation: null,
    ...overrides,
  },
});

describe('mapPublicInvitationDtoToData — wedding mapper', () => {
  it('hydrates landing.preTitle from the nested landing payload', () => {
    const dto = baseDto({ landing: { preTitle: 'We are getting married' } });
    const data = mapPublicInvitationDtoToData(dto, 'en');
    expect(data.landingTitle).toBe('We are getting married');
  });

  it('maps the rich dressCode.entries structure unchanged', () => {
    const dto = baseDto({
      dressCode: {
        entries: [
          { title: 'Ceremony', body: 'White tie' },
          { title: 'Reception', body: 'Cocktail' },
        ],
      },
    });
    const data = mapPublicInvitationDtoToData(dto, 'en');
    expect(data.dressCode).toEqual({
      entries: [
        { title: 'Ceremony', body: 'White tie' },
        { title: 'Reception', body: 'Cocktail' },
      ],
    });
  });

  it('flattens giftRegistry.notes + links into a single body string', () => {
    const dto = baseDto({
      giftRegistry: {
        notes: 'Your presence is the only gift.',
        links: [
          { label: 'Amazon', url: 'https://amazon.com/list/abc' },
          { label: 'Honeymoon', url: 'https://example.com/honeymoon' },
        ],
      },
    });
    const data = mapPublicInvitationDtoToData(dto, 'en');
    expect(data.giftRegistry).toEqual({
      body:
        'Your presence is the only gift.\nAmazon: https://amazon.com/list/abc\n' +
        'Honeymoon: https://example.com/honeymoon',
    });
  });

  it('drops empty gift links and keeps only notes when no link has both fields', () => {
    const dto = baseDto({
      giftRegistry: {
        notes: 'Bank transfer only',
        links: [{ label: '', url: 'https://orphan.com' }],
      },
    });
    const data = mapPublicInvitationDtoToData(dto, 'en');
    expect(data.giftRegistry).toEqual({ body: 'Bank transfer only' });
  });

  it('returns null giftRegistry when both notes and links are empty', () => {
    const dto = baseDto({ giftRegistry: { notes: null, links: [] } });
    const data = mapPublicInvitationDtoToData(dto, 'en');
    expect(data.giftRegistry).toBeNull();
  });

  it('flattens parents label+names for both partners', () => {
    const dto = baseDto({
      parents: {
        partner1Label: 'Daughter of',
        partner1Names: ['Jane Doe', 'John Doe'],
        partner2Label: 'Son of',
        partner2Names: ['Anne Smith'],
      },
    });
    const data = mapPublicInvitationDtoToData(dto, 'en');
    expect(data.parents).toEqual({
      body: 'Daughter of Jane Doe, John Doe\nSon of Anne Smith',
    });
  });

  it('flattens accommodation entries into a summary body', () => {
    const dto = baseDto({
      accommodation: {
        entries: [
          {
            name: 'Hotel Marivent',
            description: '5 min from venue',
            url: 'https://marivent.example.com',
            priceHint: '$120/night',
          },
          {
            name: 'Hostal del Mar',
            description: null,
            url: null,
            priceHint: null,
          },
        ],
      },
    });
    const data = mapPublicInvitationDtoToData(dto, 'en');
    expect(data.accommodation).toEqual({
      body:
        'Hotel Marivent — 5 min from venue — $120/night\nHostal del Mar',
    });
  });

  it('returns null accommodation when entries are empty', () => {
    const dto = baseDto({ accommodation: { entries: [] } });
    const data = mapPublicInvitationDtoToData(dto, 'en');
    expect(data.accommodation).toBeNull();
  });

  it('maps story.body to the public story payload', () => {
    const dto = baseDto({ story: { body: 'Our story…' } });
    const data = mapPublicInvitationDtoToData(dto, 'en');
    expect(data.story).toEqual({ body: 'Our story…' });
  });

  it('falls back to default partner names when BE returns null', () => {
    const dto = baseDto({ partner1Name: null, partner2Name: null });
    const data = mapPublicInvitationDtoToData(dto, 'es');
    expect(data.partner1Name).toBe('Pareja 1');
    expect(data.partner2Name).toBe('Pareja 2');
  });
});