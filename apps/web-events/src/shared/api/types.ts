/**
 * Shared TypeScript DTOs for the Deer Planner web portal.
 *
 * These mirror the wire shapes produced by `apps/java-api` (Spring Boot).
 * Validation on this side happens via `react-hook-form` + plain Zod-like
 * validators (see `@/shared/lib/validators.ts`); we deliberately do NOT
 * import `class-validator` on the FE — the BE is the source of truth.
 *
 * Naming follows the Java records verbatim so a future code-gen pass
 * can replace this file with auto-generated TS types.
 *
 * **Nullability is part of the contract.** When a Java DTO field is
 * nullable (e.g. `LocationsPayloadDto locations` on `EventDto`), the
 * matching TS interface must declare it as `T | null`. The TS compiler
 * then refuses any `event.locations.items` access without a `?.`, which
 * is the only way to keep the FE honest when the BE changes its mind.
 */

// =========================================================================
// Identity / Auth
// =========================================================================

export type UserRole = 'Administrator' | 'EventOrganizer';

export interface AuthenticateRequest {
  grantType: 'password';
  username: string;
  password: string;
}

export interface AuthenticateResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  phone?: string | null;
  roles: UserRole[];
  lastLoginAt?: string | null;
}

// Admin-managed CRUD projection
export interface AdminUserSummary {
  id: string;
  username: string;
  displayName: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  roles: UserRole[];
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  displayName: string;
  email: string;
  phone?: string;
  password: string;
  roles: UserRole[];
}

export interface UpdateUserRequest {
  displayName?: string;
  email?: string;
  phone?: string;
  password?: string;
  roles?: UserRole[];
}

// =========================================================================
// Events
// =========================================================================

export type EventType =
  | 'wedding'
  | 'birthday'
  | 'anniversary'
  | 'corporate'
  | 'other';

export type EventStatus = 'draft' | 'published' | 'archived';

export interface EventLocation {
  id?: string;
  label: string;
  address?: string;
  city?: string;
  mapUrl?: string;
  startsAt?: string;
  notes?: string;
}

export interface ContactEntry {
  label?: string;
  fullName?: string;
  phone?: string;
  email?: string;
}

export interface ContactsPayload {
  entries: ContactEntry[];
}

export interface ProgramItem {
  time: string; // HH:mm
  title: string;
  description?: string;
}

export interface ProgramPayload {
  items: ProgramItem[];
}

export interface LocationsPayload {
  items: EventLocation[];
}

export interface EventSummary {
  id: string;
  organizerId: string;
  eventType: EventType;
  title: string;
  eventDate: string; // YYYY-MM-DD
  status: EventStatus;
  updatedAt: string;
}

/**
 * Wire shape of `GET /api/v1/events/{id}` and every endpoint that returns
 * the full event aggregate. `locations`, `program` and `contacts` are
 * nullable on the BE: a freshly-created event has none of them yet.
 * Consumers MUST use `?.` (or run `normalizeEventDto` at the boundary).
 */
export interface EventDto {
  id: string;
  organizerId: string;
  eventType: EventType;
  title: string;
  eventDate: string;
  status: EventStatus;
  locations: LocationsPayload | null;
  program: ProgramPayload | null;
  contacts: ContactsPayload | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  title: string;
  eventType: EventType;
  eventDate: string;
}

export interface UpdateEventRequest {
  title?: string;
  eventDate?: string;
}

// Paged envelope shared by list endpoints.
export interface PagedResponse<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// Spring-Boot list endpoint wraps the page in `page`.
export interface SpringPagedResponse<T> {
  page: PagedResponse<T>;
}

// =========================================================================
// Wedding detail extension
// =========================================================================
//
// The BE's WeddingDetailDto carries each invitation module as a nested
// payload (a Java record). The wire shape mirrors the JSONB columns on
// the `wedding_events` table. The screen consumes the rich structure
// directly; the public mapper flattens it back to `{ body }` for the
// templates that historically consumed that shape.

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

export interface WeddingDetailDto {
  eventId: string;
  partner1Name?: string | null;
  partner2Name?: string | null;
  countdownEnabled?: boolean;
  landing?: WeddingLandingPayload | null;
  story?: WeddingStoryPayload | null;
  dressCode?: WeddingDressCodePayload | null;
  giftRegistry?: WeddingGiftRegistryPayload | null;
  parents?: WeddingParentsPayload | null;
  accommodation?: WeddingAccommodationPayload | null;
}

// =========================================================================
// Guests
// =========================================================================

export interface GuestGroup {
  id: string;
  eventId: string;
  name: string;
  relationship?: string | null;
  sharedEmail?: string | null;
  sharedPhone?: string | null;
  primaryGuestId?: string | null;
  invitationToken: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  id: string;
  groupId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  dietaryNotes?: string | null;
  invitationToken: string;
  rsvpStatus: 'pending' | 'confirmed' | 'declined';
  rsvpConfirmedAt?: string | null;
  rsvpMessage?: string | null;
  rsvpDietaryChoice?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGuestRequest {
  groupId?: string;
  fullName: string;
  email?: string;
  phone?: string;
  dietaryNotes?: string;
}

export interface UpdateGuestRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  dietaryNotes?: string;
}

/** Mirrors the Java enum `com.vineyards.deerPlanner.guests.domain.GuestRelationship`. */
export type GuestRelationshipValue = 'family' | 'friends' | 'other';

/**
 * Inline guest DTO embedded in `CreateGuestGroupDto`. The BE rejects
 * any group whose `guests[]` is empty or that has more than one guest
 * with `primary: true` — the screen sends exactly one primary guest.
 */
export interface InlineGuestPayload {
  fullName: string;
  email?: string;
  phone?: string;
  rsvpStatus?: 'pending' | 'confirmed' | 'declined';
  primary?: boolean;
}

export interface CreateGuestGroupRequest {
  name: string;
  relationship: GuestRelationshipValue;
  sharedEmail?: string;
  sharedPhone?: string;
  guests: InlineGuestPayload[];
}

export interface UpdateGuestGroupRequest {
  name?: string;
  relationship?: GuestRelationshipValue;
  sharedEmail?: string;
  sharedPhone?: string;
}

export interface ChangeGuestGroupRequest {
  groupId: string;
}

/**
 * Body for `PUT /events/{eventId}/guests/{guestId}/rsvp` and the
 * group-level equivalent. Mirrors the Java record `RsvpUpdateDto`,
 * whose only required field is `status` (`@NotNull RsvpStatus`).
 *
 * The FE historically named this `rsvpStatus` to mirror the entity
 * field, but the BE DTO uses `status`. Keep the wire names aligned
 * with the BE contract to avoid 400s.
 */
export interface RsvpUpdateRequest {
  status: 'pending' | 'confirmed' | 'declined';
  message?: string;
}

// =========================================================================
// Invitations
// =========================================================================

export interface InvitationTemplate {
  id: string;
  code: string;
  eventType: string;
  name: string;
  description?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListTemplatesResponse {
  items: InvitationTemplate[];
}

export interface EventInvitationConfig {
  eventId: string;
  templateId?: string | null;
  active: boolean;
  publishedAt?: string | null;
  deadline?: string | null;
  rsvpEnabled: boolean;
  rsvpDeadline?: string | null;
  slug?: string | null;
  updatedAt: string;
}

export interface UpdateInvitationConfigRequest {
  templateId?: string;
  active?: boolean;
  deadline?: string;
  rsvpEnabled?: boolean;
  rsvpDeadline?: string;
  slug?: string;
}

// =========================================================================
// Public invitation (no auth)
// =========================================================================

/**
 * `GET /api/v1/public/invitations/{slug}` response.
 *
 * The BE bundles the active event with the chosen invitation template
 * and the wedding detail. For non-wedding events, `wedding` is
 * `null` — the FE mapper falls back to the generic event shape.
 *
 * The `slug` doubles as the access token per ADR-10 (path-based URLs).
 *
 * NOTE: the wire field is `wedding` (not `weddingDetail`) — keep the
 * type aligned with the BE contract or the mapper silently drops the
 * wedding payload and renders generic placeholders.
 */
export interface PublicInvitationDto {
  slug: string;
  active: boolean;
  rsvpEnabled: boolean;
  event: EventDto;
  template: InvitationTemplate | null;
  wedding: WeddingDetailDto | null;
  updatedAt?: string;
}

/**
 * Per-guest entry returned in `PublicGroupViewDto.guests`.
 * Mirrors `GuestDto` but limited to the fields the public needs.
 */
export type PublicRsvpStatus = 'pending' | 'confirmed' | 'declined';

export interface PublicGuestDto {
  id: string;
  groupId: string;
  fullName: string;
  rsvpStatus: PublicRsvpStatus;
  rsvpConfirmedAt?: string | null;
  rsvpMessage?: string | null;
  rsvpDietaryChoice?: string | null;
}

/**
 * `GET /api/v1/public/invitations/{slug}/groups/{groupToken}` response.
 * The `group` block is the group metadata; `guests` is the list of
 * people the primary contact can confirm/decline for.
 */
export interface PublicGroupViewDto {
  slug: string;
  group: {
    id: string;
    name: string;
    sharedEmail?: string | null;
    sharedPhone?: string | null;
  };
  guests: PublicGuestDto[];
}

/**
 * `PUT /api/v1/public/invitations/{slug}/groups/{groupToken}/rsvp`
 * request body. The FE sends one entry per guest it is updating; guests
 * omitted from the request keep their previous status.
 */
export interface PublicGroupRsvpRequest {
  message?: string;
  guests: Array<{ guestId: string; status: PublicRsvpStatus }>;
}

// =========================================================================
// API error envelope
// =========================================================================

export interface ApiErrorBody {
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
  traceId?: string;
}
