import { useMemo } from 'react';

import {
  useApiClient,
  type ContactsPayload,
  type CreateEventRequest,
  type EventDto,
  type EventInvitationConfig,
  type EventSummary,
  type EventType,
  type LocationsPayload,
  type ProgramPayload,
  type UpdateEventRequest,
  type WeddingDetailDto,
} from '@/shared/api';
import { normalizeEventDto } from '@/shared/api/normalizers';
import { EventDtoSchema, WeddingDetailDtoSchema } from '@/shared/api/schemas';

// Re-export so feature code only imports from the service.
export type {
  EventDto,
  EventSummary,
  EventType,
  CreateEventRequest,
  UpdateEventRequest,
  EventInvitationConfig,
  WeddingDetailDto,
  LocationsPayload,
  ProgramPayload,
  ContactsPayload,
};

export interface ListEventsInput {
  search?: string;
  status?: 'all' | 'active' | 'draft' | 'archived';
  eventType?: EventType;
  page?: number;
  size?: number;
  sort?: 'date' | 'added';
}

export interface EventsPage {
  items: EventSummary[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Feature-level wrapper around the api-client. Memoised on `[api]`
 * (which itself is referentially stable) so consumers can safely put
 * `service` in a `useEffect` dep array or in a React-Query queryKey.
 */
export function useEventsService() {
  const api = useApiClient();
  return useMemo(() => {
    return {
      /** GET /api/v1/events — paginated list, scoped per role (admins see all). */
      listEvents(input: ListEventsInput = {}): Promise<EventsPage> {
        const search = new URLSearchParams();
        if (input.search) search.set('q', input.search);
        if (input.status && input.status !== 'all') search.set('status', input.status);
        if (input.eventType) search.set('eventType', input.eventType);
        search.set('page', String(input.page ?? 0));
        search.set('size', String(input.size ?? 20));
        if (input.sort) search.set('sort', input.sort);
        return api
          .get<{ page: EventsPage }>(`/events?${search.toString()}`)
          .then((r) => r.page);
      },

      /** GET /api/v1/events/{id} — full detail for the edit screen. */
      getEvent(id: string): Promise<EventDto> {
        return api
          .get<EventDto>(`/events/${id}`, { schema: EventDtoSchema })
          .then(normalizeEventDto);
      },

      /** POST /api/v1/events — create from the wizard. */
      createEvent(dto: CreateEventRequest): Promise<EventDto> {
        return api
          .post<EventDto>('/events', dto, { schema: EventDtoSchema })
          .then(normalizeEventDto);
      },

      /** PATCH /api/v1/events/{id} — partial update. */
      updateEvent(id: string, dto: UpdateEventRequest): Promise<EventDto> {
        return api
          .patch<EventDto>(`/events/${id}`, dto, { schema: EventDtoSchema })
          .then(normalizeEventDto);
      },

      /** DELETE /api/v1/events/{id} — permanent removal (admin only). */
      deleteEvent(id: string): Promise<void> {
        return api.delete<void>(`/events/${id}`);
      },

      /** POST /api/v1/events/{id}/archive — soft-archive. */
      archiveEvent(id: string): Promise<EventDto> {
        return api
          .post<EventDto>(`/events/${id}/archive`, undefined, { schema: EventDtoSchema })
          .then(normalizeEventDto);
      },

      // ----- Generic JSONB payloads (type-agnostic) -----

      putLocations(id: string, dto: LocationsPayload): Promise<EventDto> {
        return api
          .put<EventDto>(`/events/${id}/locations`, dto, { schema: EventDtoSchema })
          .then(normalizeEventDto);
      },

      putProgram(id: string, dto: ProgramPayload): Promise<EventDto> {
        return api
          .put<EventDto>(`/events/${id}/program`, dto, { schema: EventDtoSchema })
          .then(normalizeEventDto);
      },

      putContacts(id: string, dto: ContactsPayload): Promise<EventDto> {
        return api
          .put<EventDto>(`/events/${id}/contacts`, dto, { schema: EventDtoSchema })
          .then(normalizeEventDto);
      },

      // ----- Wedding detail extension (one record per event) -----

      getWeddingDetail(eventId: string): Promise<WeddingDetailDto> {
        return api.get<WeddingDetailDto>(`/events/${eventId}/wedding-detail`, {
          schema: WeddingDetailDtoSchema,
        });
      },
    };
  }, [api]);
}

export type EventsService = ReturnType<typeof useEventsService>;
