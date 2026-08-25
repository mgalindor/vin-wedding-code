/**
 * Port + neutral types for the list-weddings / create-wedding use cases.
 *
 * The application layer is the SOLE consumer of these types. The
 * outbound adapter (Prisma) translates them into Prisma's query DSL
 * in its own implementation of the port — the application never
 * imports `@prisma/client`.
 */
import type { WeddingDto, WeddingLocationDto } from '@wendy/contracts';

export const WEDDING_REPOSITORY_PORT = Symbol('WeddingRepositoryPort');

export interface WeddingListScope {
  readonly tenantId: string;
  // Wedding Planner: scoped to their own weddings.
  // Administrator: undefined — the tenant boundary is enough.
  readonly ownerUserId?: string;
}

export type StatusFilter =
  | { kind: 'all' }
  | { kind: 'exact'; value: 'draft' | 'published' | 'archived' }
  | { kind: 'active'; publishedAfterOrAt: Date };

export interface WeddingListFilter {
  readonly scope: WeddingListScope;
  readonly status: StatusFilter;
  readonly searchTerm?: string;
}

export type WeddingListOrderBy =
  // upcoming first by event_date ASC, then past DESC; id ASC tiebreaker
  | { kind: 'eventDateUpcomingFirst' }
  // created_at DESC; id ASC tiebreaker
  | { kind: 'createdAtNewestFirst' };

export interface ListArgs {
  readonly filter: WeddingListFilter;
  readonly orderBy: WeddingListOrderBy;
  readonly skip: number;
  readonly take: number;
}

// Neutral input shape for the create use case. The application stamps
// the principal's ids onto the right fields before handing the
// argument to the port.
export interface NewWedding {
  readonly id: string;
  readonly tenantId: string;
  readonly ownerUserId: string;
  readonly createdByUserId: string;
  readonly updatedByUserId: string;
  readonly partner1Name: string;
  readonly partner2Name: string;
  readonly eventDate: Date;
  readonly startTime: string | null;
  readonly venueName: string;
  readonly venueCity: string;
  readonly status: 'draft' | 'published' | 'archived';
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// US-010: read-by-id and update-by-id arguments.
//
// `scope` mirrors `WeddingListFilter.scope` so the same role-aware
// boundary (WP→owner, Admin→whole tenant) flows into every read and
// write without the application layer having to remember to apply it.
export interface FindByIdArgs {
  readonly scope: WeddingListScope;
  readonly id: string;
}

// Neutral input shape for the update use case. The application stamps
// `updatedAt` and `updatedByUserId` onto the right fields before
// handing the argument to the port.
export interface WeddingUpdateFields {
  readonly partner1Name: string;
  readonly partner2Name: string;
  readonly eventDate: Date;
  readonly startTime: string | null;
  readonly venueName: string;
  readonly venueCity: string;
  readonly updatedByUserId: string;
  readonly updatedAt: Date;
}

export interface UpdateByIdArgs {
  readonly scope: WeddingListScope;
  readonly id: string;
  readonly fields: WeddingUpdateFields;
}

// US-014a: locations replace the whole array on save (Rule 15) —
// the application stamps `updatedAt` / `updatedByUserId` onto the
// fields before handing the argument to the port. The mapper
// validates the array via class-validator before it lands here.
export interface UpdateLocationsArgs {
  readonly scope: WeddingListScope;
  readonly id: string;
  readonly locations: WeddingLocationDto[];
  readonly updatedByUserId: string;
  readonly updatedAt: Date;
}

export interface WeddingListRepositoryPort {
  insert(wedding: NewWedding): Promise<WeddingDto>;
  list(args: ListArgs): Promise<WeddingDto[]>;
  count(filter: WeddingListFilter): Promise<number>;
  // US-010: returns null when no row matches the scope (existence
  // and authorization are collapsed into the same null — no enumeration).
  findById(args: FindByIdArgs): Promise<WeddingDto | null>;
  // US-010: returns null when no row matches the scope (or the row
  // was deleted between the findById and this call — race-safe).
  updateById(args: UpdateByIdArgs): Promise<WeddingDto | null>;
  // US-014a: replaces the `locations` JSONB column on a wedding the
  // caller owns in their tenant. Returns null when no row matches
  // the scope (same envelope a 404 would use — no enumeration).
  updateLocations(args: UpdateLocationsArgs): Promise<WeddingDto | null>;
}
