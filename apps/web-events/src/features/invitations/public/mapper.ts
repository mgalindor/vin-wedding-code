import type {
  EventLocation,
  ProgramItem,
  ProgramPayload,
  LocationsPayload,
  PublicInvitationDto,
  WeddingDetailDto,
} from '@/shared/api';

import { getTemplateEntry } from './registry';
import type {
  AnniversaryPublicData,
  BirthdayPublicData,
  CorporatePublicData,
  PublicInvitationData,
  WeddingPublicData,
} from './types';

/**
 * Resolved locale for the public page.
 *
 * Order of precedence: explicit prop → `i18next`'s detected language →
 * `Accept-Language` header sniff → fallback `es`.
 */
export function resolvePublicLocale(
  explicit?: 'en' | 'es',
  detected?: string,
  acceptLanguage?: string,
): 'en' | 'es' {
  if (explicit === 'en' || explicit === 'es') return explicit;
  const candidates = [
    detected?.toLowerCase().split('-')[0],
    acceptLanguage?.toLowerCase().split(',')[0]?.split('-')[0],
  ];
  for (const c of candidates) {
    if (c === 'en' || c === 'es') return c;
  }
  return 'es';
}

/**
 * Maps the BE `PublicInvitationDto` into the FE's per-eventType
 * `PublicInvitationData` shape that the 27 templates consume.
 *
 * Wedding is fully hydrated from `event` + `weddingDetail`.
 * Birthday / Corporate / Anniversary fall back gracefully because
 * the BE's MVP `PublicInvitationDto` only carries wedding detail
 * (see `PublicInvitationService#getBySlug`). Once the BE extends
 * the DTO with per-type detail fields, the mapper improves without
 * callers needing to change.
 */
export function mapPublicInvitationDtoToData(
  dto: PublicInvitationDto,
  locale: 'en' | 'es',
): PublicInvitationData {
  if (!dto.template) {
    throw new Error(
      `Invitation for slug "${dto.slug}" has no template assigned.`,
    );
  }
  const templateCode = dto.template.code;
  const eventType = dto.event.eventType;
  const entry = getTemplateEntry(templateCode);
  if (!entry) {
    throw new Error(`Template "${templateCode}" is not registered on the FE.`);
  }
  if (entry.eventType !== eventType) {
    throw new Error(
      `Template "${templateCode}" is registered for ${entry.eventType} but the event is ${eventType}.`,
    );
  }

  const baseFields = {
    templateCode,
    eventDate: dto.event.eventDate,
    heroImageUrl: undefined as string | null | undefined,
    landingTitle: dto.weddingDetail?.landing?.preTitle ?? null,
    landingSubtitle: null,
    locations: mapLocations(dto.event.locations),
    program: mapProgram(dto.event.program),
    rsvpEnabled: dto.rsvpEnabled,
    locale,
  };

  switch (eventType) {
    case 'wedding':
      return mapWedding(dto, baseFields, locale);

    case 'birthday':
      return mapBirthday(dto, baseFields, locale);

    case 'corporate':
      return mapCorporate(dto, baseFields, locale);

    case 'anniversary':
      return mapAnniversary(dto, baseFields, locale);

    default:
      throw new Error(`Unsupported event type "${eventType}".`);
  }
}

interface BaseMappedFields {
  templateCode: string;
  eventDate: string;
  heroImageUrl?: string | null;
  landingTitle: string | null;
  landingSubtitle: string | null;
  locations: WeddingPublicData['locations'];
  program: WeddingPublicData['program'];
  rsvpEnabled: boolean;
  locale: 'en' | 'es';
}

function mapWedding(
  dto: PublicInvitationDto,
  base: BaseMappedFields,
  locale: 'en' | 'es',
): WeddingPublicData {
  const w = dto.weddingDetail;
  return {
    ...base,
    eventType: 'wedding',
    partner1Name: w?.partner1Name ?? defaultWeddingName(locale, 0),
    partner2Name: w?.partner2Name ?? defaultWeddingName(locale, 1),
    heroImageUrl: null,
    landingTitle: w?.landing?.preTitle ?? null,
    story: w?.story?.body ? { body: w.story.body } : null,
    dressCode: w?.dressCode?.entries?.length
      ? { entries: w.dressCode.entries.map((e) => ({ title: e.title, body: e.body })) }
      : null,
    giftRegistry: flattenGiftRegistry(w?.giftRegistry ?? null),
    parents: flattenParents(w?.parents ?? null),
    accommodation: flattenAccommodation(w?.accommodation ?? null),
  };
}

/** Compose `notes` + `links` into a single `{ body }` string templates can render. */
function flattenGiftRegistry(
  payload: WeddingDetailDto['giftRegistry'],
): WeddingPublicData['giftRegistry'] {
  if (!payload) return null;
  const notes = payload.notes?.trim() ?? '';
  const linkLines = (payload.links ?? [])
    .filter((l) => l.label && l.url)
    .map((l) => `${l.label}: ${l.url}`);
  const body = [notes, ...linkLines].filter(Boolean).join('\n');
  return body ? { body } : null;
}

/** Compose `partnerLabel + partnerNames[]` for both sides into one `{ body }`. */
function flattenParents(
  payload: WeddingDetailDto['parents'],
): WeddingPublicData['parents'] {
  if (!payload) return null;
  const side = (label: string | null | undefined, names: string[] | null | undefined): string => {
    const cleanLabel = label?.trim() ?? '';
    const cleanNames = (names ?? []).map((n) => n.trim()).filter(Boolean);
    if (!cleanLabel && cleanNames.length === 0) return '';
    const namesPart = cleanNames.join(', ');
    if (!cleanLabel) return namesPart;
    if (cleanNames.length === 0) return cleanLabel;
    return `${cleanLabel} ${namesPart}`;
  };
  const left = side(payload.partner1Label, payload.partner1Names);
  const right = side(payload.partner2Label, payload.partner2Names);
  const body = [left, right].filter(Boolean).join('\n');
  return body ? { body } : null;
}

/** Compose the accommodation entries into a single `{ body }` summary. */
function flattenAccommodation(
  payload: WeddingDetailDto['accommodation'],
): WeddingPublicData['accommodation'] {
  const entries = (payload?.entries ?? []).filter((e) => e.name?.trim());
  if (entries.length === 0) return null;
  const body = entries
    .map((e) => {
      const detail = [e.description, e.priceHint].filter(Boolean).join(' — ');
      return detail ? `${e.name} — ${detail}` : e.name;
    })
    .join('\n');
  return body ? { body } : null;
}

function mapBirthday(
  dto: PublicInvitationDto,
  base: BaseMappedFields,
  locale: 'en' | 'es',
): BirthdayPublicData {
  return {
    ...base,
    eventType: 'birthday',
    honoreeName: dto.event.title,
    ageTurning: extractAgeFromTitle(dto.event.title),
    story: null,
  };
}

function mapCorporate(
  dto: PublicInvitationDto,
  base: BaseMappedFields,
  locale: 'en' | 'es',
): CorporatePublicData {
  return {
    ...base,
    eventType: 'corporate',
    eventTitle: dto.event.title,
    hostCompanyName: undefined,
    description: null,
    speakers: null,
    dressCode: null,
  };
}

function mapAnniversary(
  dto: PublicInvitationDto,
  base: BaseMappedFields,
  locale: 'en' | 'es',
): AnniversaryPublicData {
  return {
    ...base,
    eventType: 'anniversary',
    honoreeName: dto.event.title,
    yearsCelebrating: extractYearsFromTitle(dto.event.title) ?? 25,
    story: null,
    dressCode: null,
    giftRegistry: null,
  };
}

// ---------- helpers ----------

function mapLocations(locations: LocationsPayload | null | undefined): WeddingPublicData['locations'] {
  if (!locations?.items?.length) return [];
  return locations.items.map((it: EventLocation) => ({
    label: it.label,
    name: it.label,
    address: it.address ?? undefined,
    city: it.city ?? undefined,
    mapsLink: it.mapUrl ?? undefined,
    time: it.startsAt ? it.startsAt.slice(0, 5) : undefined,
  }));
}

function mapProgram(program: ProgramPayload | null | undefined): WeddingPublicData['program'] {
  if (!program?.items?.length) return { days: [] };
  return {
    days: [
      {
        items: program.items.map((it: ProgramItem) => ({
          time: it.time,
          title: it.title,
          detail: it.description ?? undefined,
        })),
      },
    ],
  };
}

/** "Cumpleaños de Sofía — 5 años" → 5. Returns undefined when not found. */
function extractAgeFromTitle(title: string): number | undefined {
  const m = title.match(/(\d{1,3})\s*(años|years|año|year)/i);
  return m ? Number.parseInt(m[1] ?? '', 10) : undefined;
}

/** "Boda Marta & Luis — 25 años" or "25th Anniversary" → 25. */
function extractYearsFromTitle(title: string): number | undefined {
  const m = title.match(/(\d{1,3})\s*(años|years|año|year|aniversario|anniversary)/i);
  return m ? Number.parseInt(m[1] ?? '', 10) : undefined;
}

function defaultWeddingName(locale: 'en' | 'es', idx: 0 | 1): string {
  return locale === 'es' ? (idx === 0 ? 'Pareja 1' : 'Pareja 2') : idx === 0 ? 'Partner 1' : 'Partner 2';
}

/** Helper used by `PublicInvitationPage` to know if a BE response is "active". */
export function isInvitationActive(dto: PublicInvitationDto): boolean {
  return dto.active === true;
}
