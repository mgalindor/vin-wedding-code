import { useMemo } from 'react';

import { useApiClient, type AuditEntry, type PagedResponse } from '@/shared/api';

// Re-export so feature consumers (and tests) only import from this
// service instead of reaching into the shared API barrel.
export type { AuditEntry, PagedResponse };

/**
 * Page-size buckets exposed in the overview "recent activity" panel.
 * Mirrors the BE default (`@PageableDefault(size = 10)`) — keep these
 * in sync if the controller default changes. Cap at 50 because the
 * overview card sits in a 2/3-width column and anything larger hurts
 * scannability.
 */
export const ACTIVITY_PAGE_SIZES = [5, 10, 15, 30, 50] as const;
export type ActivityPageSize = (typeof ACTIVITY_PAGE_SIZES)[number];

/**
 * Resource-type buckets the user can filter by. `null` means "all".
 * Values must match the BE's `resourceType` column exactly — they're
 * sent as a query param and the BE does an exact match.
 */
export const ACTIVITY_RESOURCE_TYPES = [
  { value: null, key: 'all' },
  { value: 'event', key: 'event' },
  { value: 'wedding_event', key: 'wedding_event' },
  { value: 'guest', key: 'guest' },
  { value: 'guest_group', key: 'guest_group' },
] as const;
export type ActivityResourceType = (typeof ACTIVITY_RESOURCE_TYPES)[number]['value'];

/**
 * Coarse action buckets the user can filter by. The action namespace is
 * fine-grained (`event.metadata_updated`, `wedding_event.landing_updated`,
 * …) but for an at-a-glance filter UI a handful of categories is more
 * useful than 20+ chips. `null` means "all categories".
 *
 * Client-side filter — we keep the BE request broad and trim here so
 * we can show the total count per category without an extra round-trip.
 */
export type ActivityActionCategory =
  | 'lifecycle'
  | 'content'
  | 'rsvp'
  | 'guest';

export interface ListActivityInput {
  /** Optional filter by BE `resource_type` (e.g. `event`, `guest`). */
  resourceType?: string;
  /** Page index, 0-based. Default 0 — overview only ever needs page 0. */
  page?: number;
  /** Page size. Default 10 — the overview default. */
  size?: number;
}

export interface ActivityService {
  /**
   * `GET /api/v1/events/{eventId}/activity` — paged history of every
   * action on the event, newest first. The controller already sorts by
   * `occurredAt` DESC, so consumers can render `items[0..size-1]`
   * directly for the overview's "recent activity" panel.
   */
  listActivity(eventId: string, input?: ListActivityInput): Promise<PagedResponse<AuditEntry>>;
}

/**
 * Map a fine-grained action string to one of the coarse client-side
 * categories. Anything we don't recognise falls into `content` so the
 * FE never silently hides new actions the BE adds.
 */
export function categoryForAction(action: string): ActivityActionCategory {
  if (action === 'event.created' || action.endsWith('.archived') || action.endsWith('.restored') || action.endsWith('.deleted') || action.endsWith('.published') || action.endsWith('.unpublished') || action.endsWith('.organizer_reassigned')) {
    return 'lifecycle';
  }
  if (action.startsWith('guest.rsvp') || action.startsWith('guest_group.rsvp')) {
    return 'rsvp';
  }
  if (action.startsWith('guest.') || action.startsWith('guest_group.')) {
    return 'guest';
  }
  return 'content';
}

/**
 * Feature service for the audit module. Lives next to the other bounded
 * contexts (`guests`, `events`) so screens can wire it the same way.
 * Kept separate from `useEventsService` because the BE has its own
 * bounded context for audit, and the overview screen already pulls
 * guests + events from different services.
 */
export function useAuditService(): ActivityService {
  const api = useApiClient();
  return useMemo<ActivityService>(
    () => ({
      listActivity(eventId, input = {}) {
        const search = new URLSearchParams();
        if (input.resourceType) search.set('resourceType', input.resourceType);
        search.set('page', String(input.page ?? 0));
        search.set('size', String(input.size ?? 10));
        return api.get<PagedResponse<AuditEntry>>(
          `/events/${eventId}/activity?${search.toString()}`,
        );
      },
    }),
    [api],
  );
}
