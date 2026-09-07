/**
 * Shared types for the public invitation surface.
 *
 * `PublicInvitationData` is the discriminated union that the BE wire-up
 * (or the sample-data factory) produces. Each branch is the per-eventType
 * payload that a specific template expects.
 *
 * The shell component (`PublicInvitationPage`) looks the template up
 * via `data.templateCode` and casts through `Record<string, unknown>`
 * because the prop shapes are heterogeneous by eventType.
 */

export type PublicInvitationEventType =
  | 'wedding'
  | 'birthday'
  | 'corporate'
  | 'anniversary';

export interface PublicInvitationLocation {
  label: string;
  name: string;
  address?: string;
  city?: string;
  mapsLink?: string;
  time?: string;
}

export interface PublicInvitationProgramItem {
  time: string;
  title: string;
  detail?: string;
}

export interface PublicInvitationProgramDay {
  date?: string;
  label?: string;
  items: PublicInvitationProgramItem[];
}

export interface PublicInvitationProgram {
  days: PublicInvitationProgramDay[];
}

export type PublicInvitationLocale = 'en' | 'es';

export interface WeddingPublicData {
  eventType: 'wedding';
  templateCode: string;
  partner1Name: string;
  partner2Name: string;
  eventDate: string;
  heroImageUrl?: string | null;
  landingTitle?: string | null;
  landingSubtitle?: string | null;
  story?: { body: string } | null;
  dressCode?: { entries: { title: string; body: string }[] } | null;
  giftRegistry?: { body: string } | null;
  parents?: { body: string } | null;
  accommodation?: { body: string } | null;
  locations: PublicInvitationLocation[];
  program: PublicInvitationProgram;
  rsvpEnabled: boolean;
  locale: PublicInvitationLocale;
}

export interface BirthdayPublicData {
  eventType: 'birthday';
  templateCode: string;
  honoreeName: string;
  ageTurning?: number | null;
  eventDate: string;
  heroImageUrl?: string | null;
  landingTitle?: string | null;
  landingSubtitle?: string | null;
  story?: { body: string } | null;
  locations: PublicInvitationLocation[];
  program: PublicInvitationProgram;
  rsvpEnabled: boolean;
  locale: PublicInvitationLocale;
}

export interface CorporateSpeaker {
  name: string;
  role: string;
  bio?: string;
  photoUrl?: string | null;
}

export interface CorporatePublicData {
  eventType: 'corporate';
  templateCode: string;
  eventTitle: string;
  hostCompanyName?: string;
  eventDate: string;
  heroImageUrl?: string | null;
  landingTitle?: string | null;
  landingSubtitle?: string | null;
  description?: { body: string } | null;
  speakers?: CorporateSpeaker[] | null;
  dressCode?: { body: string } | null;
  locations: PublicInvitationLocation[];
  program: PublicInvitationProgram;
  rsvpEnabled: boolean;
  locale: PublicInvitationLocale;
}

export interface AnniversaryPublicData {
  eventType: 'anniversary';
  templateCode: string;
  honoreeName: string;
  yearsCelebrating: number;
  eventDate: string;
  heroImageUrl?: string | null;
  landingTitle?: string | null;
  landingSubtitle?: string | null;
  story?: { body: string } | null;
  dressCode?: { body: string } | null;
  giftRegistry?: { body: string } | null;
  locations: PublicInvitationLocation[];
  program: PublicInvitationProgram;
  rsvpEnabled: boolean;
  locale: PublicInvitationLocale;
}

export type PublicInvitationData =
  | WeddingPublicData
  | BirthdayPublicData
  | CorporatePublicData
  | AnniversaryPublicData;

/**
 * Props contract for the shell component. The shell owns the
 * `token`, the optional RSVP callback and the locale; the per-eventType
 * payload is passed through `data`.
 */
export interface PublicInvitationPageProps<
  T extends PublicInvitationData = PublicInvitationData,
> {
  data: T;
  onRsvpClick?: () => void;
  token: string;
  locale: PublicInvitationLocale;
}

/**
 * Helper: type-safe contract between the wire (BE) and the registry.
 * All other template prop shapes (parents, accommodation, etc.) should be
 * extracted from data[eventType] by a `normalizeInvitationData` in the
 * future. For MVP we pass the per-eventType payload directly.
 */