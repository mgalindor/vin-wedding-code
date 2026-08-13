/**
 * Branded ID types for every entity the system will mint (ADR-13).
 *
 * Format: 10-char URL-safe NanoId, minted in app code on either side of
 * the wire. Runtime value is a string; the brand is a phantom type that
 * only exists at compile time.
 */

export { nanoid, customAlphabet } from 'nanoid';

export type Brand<TName extends string> = string & {
  readonly __brand: TName;
};

import { nanoid as rawNanoid } from 'nanoid';

export function newId<T extends Brand<string>>(): T {
  return rawNanoid(10) as T;
}

// Identity & Access
export type UserId = Brand<'UserId'>;
export type TenantId = Brand<'TenantId'>;

// Wedding Management
export type WeddingId = Brand<'WeddingId'>;

// Guest Management
export type GuestGroupId = Brand<'GuestGroupId'>;
export type GuestId = Brand<'GuestId'>;
export type RsvpId = Brand<'RsvpId'>;

// Photo Storage
export type PhotoId = Brand<'PhotoId'>;
export type GuestPhotoId = Brand<'GuestPhotoId'>;

// Audit
export type AuditEventId = Brand<'AuditEventId'>;

// Public tokens — the URL carries a signed JWT; these ids identify the
// row that stores the token's metadata (ADR-13).
export type InvitationTokenId = Brand<'InvitationTokenId'>;
export type PhotoAlbumTokenId = Brand<'PhotoAlbumTokenId'>;