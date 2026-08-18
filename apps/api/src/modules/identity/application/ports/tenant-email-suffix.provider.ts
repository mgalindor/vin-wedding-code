import type { TenantId } from '../../../../shared/jwt/jwt.service';

export const TENANT_EMAIL_SUFFIX_PROVIDER = Symbol(
  'TenantEmailSuffixProvider',
);

export interface TenantEmailSuffixProvider {
  findSuffixByTenantId(tenantId: TenantId): Promise<string | null>;
}