import type { TenantId, UserId } from '../../../shared/jwt/jwt.service';

export interface AdminPrincipal {
  readonly actorId: UserId;
  readonly tenantId: TenantId;
}