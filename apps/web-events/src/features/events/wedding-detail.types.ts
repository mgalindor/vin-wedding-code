// Re-export from types.ts
export type {
  EventLocation,
  ContactsPayload,
  ProgramItem,
  ProgramPayload,
  LocationsPayload,
} from '@/shared/api/types';

// Wedding-specific per-section payload DTOs mirror the Java records
// in `com.vineyards.deerPlanner.events.facade.dto.*PayloadDto`. Each
// one is the wire shape the matching `PUT /events/{id}/wedding-*`
// endpoint accepts.

export interface UpdateWeddingDetailRequest {
  partner1Name?: string | null;
  partner2Name?: string | null;
  countdownEnabled?: boolean | null;
}

export interface WeddingLandingPayload {
  preTitle?: string | null;
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

export interface WeddingGiftRegistryLink {
  label: string;
  url: string;
}

export interface WeddingGiftRegistryPayload {
  links?: WeddingGiftRegistryLink[] | null;
  notes?: string | null;
}

export interface WeddingParentsPayload {
  partner1Label?: string | null;
  partner1Names?: string[] | null;
  partner2Label?: string | null;
  partner2Names?: string[] | null;
}

export interface WeddingAccommodationEntry {
  name: string;
  description?: string | null;
  url?: string | null;
  priceHint?: string | null;
}

export interface WeddingAccommodationPayload {
  entries?: WeddingAccommodationEntry[] | null;
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
