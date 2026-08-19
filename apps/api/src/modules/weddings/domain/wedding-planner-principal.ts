import type { TenantId, UserId } from '../../../shared/jwt/jwt.service';

/**
 * Wedding-creation principal (Rule 2 + Rule 3 of the functional spec).
 *
 * Mirrors the shape of `AdminPrincipal` for the identity context but
 * represents a Wedding Planner session — the only role allowed to
 * create a wedding via `POST /api/v1/weddings`.
 *
 * `tenantId` and `actorId` come from the JWT (ADR-05); the FE never
 * sends them and the application code never reads them from the
 * request body (Rule 10 of the identity functional spec).
 *
 * When the Admin-as-WP dual role is enabled (ARC-011) the same shape
 * applies — an Administrator who also has a Wedding Planner row signs
 * in as `WeddingPlanner` and reaches the create endpoint via this
 * principal.
 */
export interface WeddingPlannerPrincipal {
  readonly actorId: UserId;
  readonly tenantId: TenantId;
}