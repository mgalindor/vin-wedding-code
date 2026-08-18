import { Injectable } from '@nestjs/common';

import { TenantId } from '../../../shared/jwt/jwt.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  TENANT_EMAIL_SUFFIX_PROVIDER,
  type TenantEmailSuffixProvider,
} from '../application/ports/tenant-email-suffix.provider';

@Injectable()
export class PrismaTenantEmailSuffixProvider
  implements TenantEmailSuffixProvider
{
  constructor(private readonly prisma: PrismaService) {}

  async findSuffixByTenantId(tenantId: TenantId): Promise<string | null> {
    const row = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
      select: { email_suffix: true },
    });
    return row?.email_suffix ?? null;
  }
}

export const tenantEmailSuffixProviderBinding = {
  provide: TENANT_EMAIL_SUFFIX_PROVIDER,
  useClass: PrismaTenantEmailSuffixProvider,
} as const;