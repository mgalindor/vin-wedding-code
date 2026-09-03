/**
 * Zod schemas for the wire shapes produced by `apps/java-api`.
 *
 * Why these exist:
 *   - `shared/api/types.ts` declares the TS shape; `tsc` enforces it at
 *     compile time but not at runtime.
 *   - When the BE changes a field name, an enum value, or drops a field,
 *     the FE will silently accept the new shape — and surface it as a
 *     crash later (like the "Cannot read properties of undefined
 *     (reading 'items')" bug in the events overview).
 *   - These schemas parse every API response. A failure surfaces as an
 *     `ApiError(500, 'schema_drift', ...)` with the traceId, so the
 *     caller gets a clear signal and the support team can correlate
 *     with a BE deploy.
 *
 * **The contract:** every endpoint that returns a parsed shape must pass
 * the schema to `ApiClient.request`. New endpoints default to
 * un-parsed (`as T` cast); opt in as schemas land.
 *
 * Coverage today: the shapes that caused the events-overview bug.
 * Add schemas here as new endpoints ship; do not add endpoints without
 * a matching schema — see the engineering rule in `backend-java-
 * blueprint.md`.
 */

import { z } from 'zod';

const isoDateString = z.iso.date();
const isoInstantString = z.iso.datetime({ offset: true });

export const EventTypeSchema = z.enum([
  'wedding',
  'birthday',
  'anniversary',
  'corporate',
  'other',
]);

export const EventStatusSchema = z.enum(['draft', 'published', 'archived']);

export const EventLocationSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  address: z.string().optional(),
  city: z.string().optional(),
  mapUrl: z.string().optional(),
  startsAt: z.string().optional(),
  notes: z.string().optional(),
});

export const ProgramItemSchema = z.object({
  time: z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm'),
  title: z.string(),
  description: z.string().optional(),
});

export const ContactsPayloadSchema = z
  .object({
    primaryContactName: z.string().optional(),
    primaryContactPhone: z.string().optional(),
    primaryContactEmail: z.string().optional(),
    secondaryContactName: z.string().optional(),
    secondaryContactPhone: z.string().optional(),
  })
  .nullable();

export const LocationsPayloadSchema = z
  .object({ items: z.array(EventLocationSchema) })
  .nullable();

export const ProgramPayloadSchema = z
  .object({ items: z.array(ProgramItemSchema) })
  .nullable();

export const EventDtoSchema = z.object({
  id: z.string(),
  organizerId: z.string(),
  eventType: EventTypeSchema,
  title: z.string(),
  eventDate: isoDateString,
  status: EventStatusSchema,
  locations: LocationsPayloadSchema,
  program: ProgramPayloadSchema,
  contacts: ContactsPayloadSchema,
  createdAt: isoInstantString,
  updatedAt: isoInstantString,
});

export const WeddingDetailDtoSchema = z.object({
  eventId: z.string(),
  partner1Name: z.string().nullable().optional(),
  partner2Name: z.string().nullable().optional(),
  storyHtml: z.string().nullable().optional(),
  dressCode: z.string().nullable().optional(),
  giftRegistry: z.string().nullable().optional(),
  parents: z.string().nullable().optional(),
  accommodation: z.string().nullable().optional(),
  landingTitle: z.string().nullable().optional(),
  landingSubtitle: z.string().nullable().optional(),
  heroImageUrl: z.string().nullable().optional(),
  updatedAt: isoInstantString,
});

export const EventSummarySchema = z.object({
  id: z.string(),
  organizerId: z.string(),
  eventType: EventTypeSchema,
  title: z.string(),
  eventDate: isoDateString,
  status: EventStatusSchema,
  updatedAt: isoInstantString,
});

export const PagedResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int().nonnegative(),
    size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    hasMore: z.boolean(),
  });

export const SpringPagedResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ page: PagedResponseSchema(item) });

export const ApiErrorBodySchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  traceId: z.string().optional(),
});

/** Re-exported for tests and downstream consumers. */
export type EventDtoParsed = z.infer<typeof EventDtoSchema>;
export type WeddingDetailDtoParsed = z.infer<typeof WeddingDetailDtoSchema>;
export type EventSummaryParsed = z.infer<typeof EventSummarySchema>;