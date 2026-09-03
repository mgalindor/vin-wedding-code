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

export interface ContactsPayload {
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  secondaryContactName?: string;
  secondaryContactPhone?: string;
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

export interface WeddingDetailDto {
  eventId: string;
  partner1Name?: string | null;
  partner2Name?: string | null;
  storyHtml?: string | null;
  dressCode?: string | null;
  giftRegistry?: string | null;
  parents?: string | null;
  accommodation?: string | null;
  landingTitle?: string | null;
  landingSubtitle?: string | null;
  heroImageUrl?: string | null;
  updatedAt: string;
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
  firstName: string;
  lastName: string;
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
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dietaryNotes?: string;
}

export interface UpdateGuestRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dietaryNotes?: string;
}

export interface CreateGuestGroupRequest {
  name: string;
  relationship?: string;
  sharedEmail?: string;
  sharedPhone?: string;
}

export interface UpdateGuestGroupRequest {
  name?: string;
  relationship?: string;
  sharedEmail?: string;
  sharedPhone?: string;
}

export interface ChangeGuestGroupRequest {
  groupId: string;
}

export interface RsvpUpdateRequest {
  rsvpStatus: 'pending' | 'confirmed' | 'declined';
  rsvpMessage?: string;
  rsvpDietaryChoice?: string;
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
// API error envelope
// =========================================================================

export interface ApiErrorBody {
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
  traceId?: string;
}
