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
 *
 * **Tightness policy:** strict on enums (the main drift risk — a BE
 * renames a value and the FE would silently misbehave), permissive on
 * payload shapes and timestamp formats (the FE has historically had a
 * different shape in `types.ts` than the BE sends; tightening these
 * would block valid traffic until both sides align). The FE's `types.ts`
 * is the legacy shape; the BE shape is what's on the wire. They drift,
 * and that drift is something to fix in the FE, not something to crash
 * on. The schema exists to catch enum drift, not field-name drift.
 *
 * **Timestamp formats (BE-side note):** Spring Boot with Jackson defaults
 * to emitting `Instant` as a numeric epoch (`1717555200000`) UNLESS the
 * application sets `spring.jackson.serialization.write-dates-as-timestamps=false`.
 * Until that's flipped in the BE, accept BOTH shapes on the FE (string
 * ISO + numeric millis-or-seconds) and normalise to ISO. Once the BE
 * flips the property, the numeric branch becomes dead code and can
 * be removed.
 */

import { z } from 'zod';

const isoDateString = z.string().refine(
  (v) => !Number.isNaN(Date.parse(v)) && /^\d{4}-\d{2}-\d{2}/.test(v),
  { message: 'expected ISO date string (YYYY-MM-DD...)' },
);

/**
 * Accept three timestamp formats emitted by Spring Boot + Jackson:
 *   1. ISO 8601 with explicit offset (`2026-09-03T10:15:30.000+00:00`)
 *   2. ISO 8601 trailing-Z (`2026-09-03T10:15:30.000Z`)
 *   3. Numeric epoch — millis OR seconds; auto-detected by magnitude
 * Anything that lands gets normalised to an ISO 8601 string with `Z`.
 */
const isoInstantString = z
  .union([
    z.string().datetime({ offset: true }),
    z.string().datetime(),
    z.number(),
  ])
  .transform((v) => {
    if (typeof v === 'number') {
      // 1e12 ≈ year 33658 in seconds; below that we assume ms.
      const millis = v < 1e12 ? v * 1000 : v;
      return new Date(millis).toISOString();
    }
    return v;
  });

export const EventTypeSchema = z.enum([
  'wedding',
  'birthday',
  'anniversary',
  'corporate',
  'other',
]);

export const EventStatusSchema = z.enum(['draft', 'published', 'archived']);

/** Permissive on purpose — see "Tightness policy" above. Matches the BE wire shape. */
export const LocationsPayloadSchema = z
  .object({
    entries: z.array(z.object({}).passthrough()).optional(),
  })
  .passthrough()
  .nullable();

export const ProgramPayloadSchema = z
  .object({
    days: z.array(z.object({}).passthrough()).optional(),
  })
  .passthrough()
  .nullable();

export const ContactsPayloadSchema = z
  .object({
    entries: z.array(z.object({}).passthrough()).optional(),
  })
  .passthrough()
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