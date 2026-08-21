/**
 * Port + neutral types for the list-weddings / create-wedding use cases.
 *
 * The application layer is the SOLE consumer of these types. The
 * outbound adapter (Prisma) translates them into Prisma's query DSL
 * in its own implementation of the port — the application never
 * imports `@prisma/client`.
 */
import type { WeddingDto } from '@wendy/contracts';

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
  readonly venueName: string;
  readonly venueCity: string;
  readonly status: 'draft' | 'published' | 'archived';
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface WeddingListRepositoryPort {
  insert(wedding: NewWedding): Promise<WeddingDto>;
  list(args: ListArgs): Promise<WeddingDto[]>;
  count(filter: WeddingListFilter): Promise<number>;
}
