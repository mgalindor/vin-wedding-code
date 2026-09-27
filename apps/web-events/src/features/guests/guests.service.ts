import { useMemo } from 'react';

import {
  useApiClient,
  type ChangeGuestGroupRequest,
  type CreateGuestGroupRequest,
  type CreateGuestRequest,
  type Guest,
  type GuestGroup,
  type RsvpUpdateRequest,
  type UpdateGuestGroupRequest,
  type UpdateGuestRequest,
} from '@/shared/api';

export interface ListGuestsInput {
  groupId?: string;
  rsvpStatus?: 'pending' | 'confirmed' | 'declined';
  search?: string;
  page?: number;
  size?: number;
}

export interface GuestsPage {
  items: Guest[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasMore: boolean;
}

export interface GuestsService {
  // Groups
  listGroups(eventId: string): Promise<{ items: GuestGroup[] }>;
  getGroup(eventId: string, groupId: string): Promise<GuestGroup>;
  createGroup(eventId: string, dto: CreateGuestGroupRequest): Promise<GuestGroup>;
  updateGroup(eventId: string, groupId: string, dto: UpdateGuestGroupRequest): Promise<GuestGroup>;
  deleteGroup(eventId: string, groupId: string): Promise<void>;
  regenerateGroupToken(eventId: string, groupId: string): Promise<GuestGroup>;
  updatePrimaryGuest(eventId: string, groupId: string, guestId: string): Promise<GuestGroup>;

  // Guests
  listGuests(eventId: string, input: ListGuestsInput): Promise<GuestsPage>;
  getGuest(eventId: string, guestId: string): Promise<Guest>;
  createGuest(eventId: string, dto: CreateGuestRequest): Promise<Guest>;
  updateGuest(eventId: string, guestId: string, dto: UpdateGuestRequest): Promise<Guest>;
  changeGuestGroup(eventId: string, guestId: string, dto: ChangeGuestGroupRequest): Promise<Guest>;
  deleteGuest(eventId: string, guestId: string): Promise<void>;

  // RSVP
  markGuestRsvp(eventId: string, guestId: string, dto: RsvpUpdateRequest): Promise<Guest>;
  markGroupRsvp(eventId: string, groupId: string, dto: RsvpUpdateRequest): Promise<GuestGroup>;
}

/**
 * Feature service for the guests module. All endpoints live under
 * `/api/v1/events/{eventId}/...`; the service keeps the URLs in one
 * place so screens don't have to assemble them by hand.
 */
export function useGuestsService(): GuestsService {
  const api = useApiClient();
  return useMemo<GuestsService>(
    () => ({
      // ---- Groups ----
      listGroups(eventId) {
        return api.get<{ items: GuestGroup[] }>(
          `/events/${eventId}/guest-groups`,
        );
      },
      getGroup(eventId, groupId) {
        return api.get<GuestGroup>(`/events/${eventId}/guest-groups/${groupId}`);
      },
      createGroup(eventId, dto) {
        return api.post<GuestGroup>(`/events/${eventId}/guest-groups`, dto);
      },
      updateGroup(eventId, groupId, dto) {
        return api.patch<GuestGroup>(`/events/${eventId}/guest-groups/${groupId}`, dto);
      },
      deleteGroup(eventId, groupId) {
        return api.delete<void>(`/events/${eventId}/guest-groups/${groupId}`);
      },
      regenerateGroupToken(eventId, groupId) {
        return api.post<GuestGroup>(
          `/events/${eventId}/guest-groups/${groupId}/regenerate-token`,
        );
      },
      updatePrimaryGuest(eventId, groupId, guestId) {
        return api.put<GuestGroup>(
          `/events/${eventId}/guest-groups/${groupId}/primary`,
          { guestId },
        );
      },

      // ---- Guests ----
      async listGuests(eventId, input) {
        const search = new URLSearchParams();
        if (input.groupId) search.set('groupId', input.groupId);
        if (input.rsvpStatus) search.set('rsvpStatus', input.rsvpStatus);
        if (input.search) search.set('q', input.search);
        search.set('page', String(input.page ?? 0));
        search.set('size', String(input.size ?? 50));
        const res: unknown = await api.get(
          `/events/${eventId}/guests?${search.toString()}`,
        );
        if (res && typeof res === 'object' && 'page' in (res as Record<string, unknown>)) {
          return (res as { page: GuestsPage }).page;
        }
        return res as GuestsPage;
      },
      getGuest(eventId, guestId) {
        return api.get<Guest>(`/events/${eventId}/guests/${guestId}`);
      },
      createGuest(eventId, dto) {
        return api.post<Guest>(`/events/${eventId}/guests`, dto);
      },
      updateGuest(eventId, guestId, dto) {
        return api.patch<Guest>(`/events/${eventId}/guests/${guestId}`, dto);
      },
      changeGuestGroup(eventId, guestId, dto) {
        return api.patch<Guest>(
          `/events/${eventId}/guests/${guestId}/group`,
          dto,
        );
      },
      deleteGuest(eventId, guestId) {
        return api.delete<void>(`/events/${eventId}/guests/${guestId}`);
      },

      // ---- RSVP ----
      markGuestRsvp(eventId, guestId, dto) {
        return api.put<Guest>(
          `/events/${eventId}/guests/${guestId}/rsvp`,
          dto,
        );
      },
      markGroupRsvp(eventId, groupId, dto) {
        return api.put<GuestGroup>(
          `/events/${eventId}/guest-groups/${groupId}/rsvp`,
          dto,
        );
      },
    }),
    [api],
  );
}
