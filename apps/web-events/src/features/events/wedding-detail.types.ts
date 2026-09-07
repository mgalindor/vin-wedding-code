// Re-export from types.ts
export type {
  EventLocation,
  ContactsPayload,
  ProgramItem,
  ProgramPayload,
  LocationsPayload,
} from '@/shared/api/types';

// Wedding-specific per-section payload DTOs mirror the Java records.

export interface UpdateWeddingDetailRequest {
  partner1Name?: string | null;
  partner2Name?: string | null;
  landingTitle?: string | null;
  landingSubtitle?: string | null;
  heroImageUrl?: string | null;
}

export interface WeddingStoryPayload {
  body: string;
}

export interface WeddingDressCodeEntry {
  title: string;
  body: string;
}

export interface WeddingDressCodePayload {
  entries: WeddingDressCodeEntry[];
}

export interface WeddingGiftRegistryPayload {
  body: string;
}

export interface WeddingParentsPayload {
  body: string;
}

export interface WeddingAccommodationPayload {
  body: string;
}

export interface WeddingLandingPayload {
  landingTitle?: string | null;
  landingSubtitle?: string | null;
  heroImageUrl?: string | null;
}

export interface InvitationTemplateSummary {
  id: string;
  code: string;
  eventType: string;
  name: string;
  description?: string;
  displayOrder: number;
  previewUrl?: string | null;
}
